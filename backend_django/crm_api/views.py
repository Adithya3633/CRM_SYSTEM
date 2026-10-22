from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Count, Q, Sum, Value, IntegerField, DecimalField, Case, When
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Contact, Customer, Lead, MeetingNote, Organization, Purchase, User
from .permissions import IsAdmin
from .serializers import ContactSerializer, CustomerSerializer, LeadSerializer, MeetingNoteSerializer, OrganizationSerializer, PurchaseSerializer, UserSerializer


def auth_response(user, http_status=status.HTTP_200_OK):
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    refresh['name'] = user.name
    refresh['organization_id'] = user.organization_id
    return Response({'token': str(refresh.access_token), 'user': UserSerializer(user).data}, status=http_status)


def scoped_user(request, user_id):
    if not user_id:
        return request.user
    return User.objects.filter(id=user_id, organization_id=request.user.organization_id).first()


class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'ok'})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = str(request.data.get('name', '')).strip()
        email = str(request.data.get('email', '')).strip().lower()
        password = request.data.get('password', '')
        organization_name = str(request.data.get('organizationName', '')).strip()
        if not all([name, email, password, organization_name]):
            return Response({'error': 'Name, email, password, and organization name are required'}, status=400)
        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=400)
        try:
            with transaction.atomic():
                organization = Organization.objects.create(name=organization_name)
                user = User.objects.create_user(email=email, password=password, name=name, role=User.Role.ADMIN, organization=organization)
        except Exception as error:
            if 'unique' in str(error).lower() or 'duplicate' in str(error).lower():
                return Response({'error': 'Email already exists'}, status=409)
            raise
        return auth_response(user, status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        password = request.data.get('password', '')
        account_type = request.data.get('account_type')
        if account_type is not None and account_type not in ('admin', 'user'):
            return Response({'error': 'Choose Admin or Normal User account type'}, status=400)
        if not email or not password:
            return Response({'error': 'Email and password required'}, status=400)
        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=401)
        if account_type is not None and ((account_type == 'admin') != (user.role == User.Role.ADMIN)):
            return Response({'error': 'This account does not match the selected account type'}, status=403)
        return auth_response(user)


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UsersView(APIView):
    def get(self, request):
        return Response(UserSerializer(User.objects.filter(organization_id=request.user.organization_id), many=True).data)

    def post(self, request):
        if request.user.role != User.Role.ADMIN:
            return Response({'error': 'Insufficient permissions'}, status=403)
        data = request.data
        required = ['name', 'email', 'password', 'role']
        if not all(data.get(field) for field in required):
            return Response({'error': 'All fields required'}, status=400)
        try:
            user = User.objects.create_user(email=data['email'].strip().lower(), password=data['password'], name=data['name'], role=data['role'], organization=request.user.organization)
        except Exception:
            return Response({'error': 'Email already exists'}, status=409)
        return Response(UserSerializer(user).data, status=201)


class UserDetailView(APIView):
    def put(self, request, pk):
        if request.user.role != User.Role.ADMIN:
            return Response({'error': 'Insufficient permissions'}, status=403)
        user = User.objects.filter(id=pk, organization_id=request.user.organization_id).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)
        for field in ['name', 'email', 'role']:
            if request.data.get(field):
                setattr(user, field, request.data[field])
        if request.data.get('password'):
            user.set_password(request.data['password'])
        user.save()
        return Response(UserSerializer(user).data)

    def delete(self, request, pk):
        if request.user.role != User.Role.ADMIN:
            return Response({'error': 'Insufficient permissions'}, status=403)
        if int(pk) == request.user.id:
            return Response({'error': 'Cannot delete your own account'}, status=400)
        deleted, _ = User.objects.filter(id=pk, organization_id=request.user.organization_id).delete()
        if not deleted:
            return Response({'error': 'User not found'}, status=404)
        return Response({'success': True})


class OrganizationView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response(OrganizationSerializer(request.user.organization).data)

    def put(self, request):
        organization = request.user.organization
        serializer = OrganizationSerializer(organization, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


def filter_queryset(request, queryset, search_fields):
    search = request.query_params.get('search')
    if search:
        query = Q()
        for field in search_fields:
            query |= Q(**{f'{field}__icontains': search})
        queryset = queryset.filter(query)
    return queryset


class LeadsView(APIView):
    def get(self, request):
        queryset = Lead.objects.filter(organization_id=request.user.organization_id).select_related('assigned_to')
        if request.user.role == User.Role.SALES_EXECUTIVE:
            queryset = queryset.filter(assigned_to=request.user)
        queryset = filter_queryset(request, queryset, ['name', 'email', 'company', 'phone'])
        for field in ['stage', 'source']:
            if request.query_params.get(field):
                queryset = queryset.filter(**{field: request.query_params[field]})
        if request.query_params.get('assigned_to'):
            queryset = queryset.filter(assigned_to_id=request.query_params['assigned_to'])
        if request.query_params.get('min_value'):
            queryset = queryset.filter(value__gte=request.query_params['min_value'])
        if request.query_params.get('max_value'):
            queryset = queryset.filter(value__lte=request.query_params['max_value'])
        return Response(LeadSerializer(queryset.order_by('-updated_at'), many=True).data)

    def post(self, request):
        data = request.data.copy()
        data['assigned_to'] = request.user.id if request.user.role == User.Role.SALES_EXECUTIVE else data.get('assigned_to') or request.user.id
        if data.get('assigned_to') and not scoped_user(request, data['assigned_to']):
            return Response({'error': 'Invalid assignee'}, status=400)
        serializer = LeadSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save(organization=request.user.organization)
        return Response(LeadSerializer(lead).data, status=201)


class LeadDetailView(APIView):
    def get_object(self, request, pk):
        queryset = Lead.objects.filter(id=pk, organization_id=request.user.organization_id)
        if request.user.role == User.Role.SALES_EXECUTIVE:
            queryset = queryset.filter(assigned_to=request.user)
        return queryset.first()

    def get(self, request, pk):
        lead = self.get_object(request, pk)
        return Response(LeadSerializer(lead).data) if lead else Response({'error': 'Lead not found'}, status=404)

    def put(self, request, pk):
        lead = self.get_object(request, pk)
        if not lead:
            return Response({'error': 'Lead not found'}, status=404)
        if request.data.get('assigned_to') and not scoped_user(request, request.data['assigned_to']):
            return Response({'error': 'Invalid assignee'}, status=400)
        serializer = LeadSerializer(lead, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(assigned_to=lead.assigned_to if request.user.role == User.Role.SALES_EXECUTIVE else serializer.validated_data.get('assigned_to', lead.assigned_to))
        return Response(LeadSerializer(lead).data)

    def delete(self, request, pk):
        lead = self.get_object(request, pk)
        if not lead:
            return Response({'error': 'Lead not found'}, status=404)
        lead.delete()
        return Response({'success': True})


class LeadStageView(APIView):
    def patch(self, request, pk):
        lead = LeadDetailView().get_object(request, pk)
        if not lead:
            return Response({'error': 'Lead not found'}, status=404)
        if request.data.get('stage') not in Lead.Stage.values:
            return Response({'error': 'Valid stage required'}, status=400)
        lead.stage = request.data['stage']
        lead.save(update_fields=['stage', 'updated_at'])
        return Response(LeadSerializer(lead).data)


class CustomersView(APIView):
    def get(self, request):
        queryset = Customer.objects.filter(organization_id=request.user.organization_id).select_related('assigned_to')
        if request.user.role == User.Role.SALES_EXECUTIVE:
            queryset = queryset.filter(assigned_to=request.user)
        queryset = filter_queryset(request, queryset, ['name', 'email', 'company', 'phone'])
        if request.query_params.get('status'):
            queryset = queryset.filter(status=request.query_params['status'])
        if request.query_params.get('assigned_to'):
            queryset = queryset.filter(assigned_to_id=request.query_params['assigned_to'])
        return Response(CustomerSerializer(queryset.order_by('-updated_at'), many=True).data)

    def post(self, request):
        data = request.data.copy()
        data['assigned_to'] = request.user.id if request.user.role == User.Role.SALES_EXECUTIVE else data.get('assigned_to') or request.user.id
        if data.get('assigned_to') and not scoped_user(request, data['assigned_to']):
            return Response({'error': 'Invalid assignee'}, status=400)
        serializer = CustomerSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save(organization=request.user.organization)
        return Response(CustomerSerializer(customer).data, status=201)


class CustomerDetailView(APIView):
    def get_object(self, request, pk):
        queryset = Customer.objects.filter(id=pk, organization_id=request.user.organization_id)
        if request.user.role == User.Role.SALES_EXECUTIVE:
            queryset = queryset.filter(assigned_to=request.user)
        return queryset.first()

    def get(self, request, pk):
        customer = self.get_object(request, pk)
        return Response(CustomerSerializer(customer).data) if customer else Response({'error': 'Customer not found'}, status=404)

    def put(self, request, pk):
        customer = self.get_object(request, pk)
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        if request.data.get('assigned_to') and not scoped_user(request, request.data['assigned_to']):
            return Response({'error': 'Invalid assignee'}, status=400)
        serializer = CustomerSerializer(customer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(assigned_to=customer.assigned_to if request.user.role == User.Role.SALES_EXECUTIVE else serializer.validated_data.get('assigned_to', customer.assigned_to))
        return Response(CustomerSerializer(customer).data)

    def delete(self, request, pk):
        customer = self.get_object(request, pk)
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        customer.delete()
        return Response({'success': True})


class CustomerRelatedView(APIView):
    def post(self, request, pk, related):
        customer = CustomerDetailView().get_object(request, pk)
        if not customer:
            return Response({'error': 'Customer not found'}, status=404)
        if related == 'contacts':
            serializer = ContactSerializer(data=request.data)
            required_error = 'Contact name required'
            model = Contact
        elif related == 'purchases':
            serializer = PurchaseSerializer(data=request.data)
            required_error = 'Product, amount, and date required'
            model = Purchase
        else:
            serializer = MeetingNoteSerializer(data=request.data)
            required_error = 'Title and meeting date required'
            model = MeetingNote
        serializer.is_valid(raise_exception=True)
        if model is MeetingNote:
            item = serializer.save(customer=customer, user=request.user)
        else:
            item = serializer.save(customer=customer)
        return Response(serializer.__class__(item).data, status=201)


class DashboardView(APIView):
    def get(self, request):
        leads = Lead.objects.filter(organization_id=request.user.organization_id)
        customers = Customer.objects.filter(organization_id=request.user.organization_id)
        if request.user.role == User.Role.SALES_EXECUTIVE:
            leads = leads.filter(assigned_to=request.user)
            customers = customers.filter(assigned_to=request.user)
        total = leads.count()
        won = leads.filter(stage=Lead.Stage.WON).count()
        lost = leads.filter(stage=Lead.Stage.LOST).count()
        lead_revenue = leads.filter(stage=Lead.Stage.WON).aggregate(total=Coalesce(Sum('value'), Value(Decimal('0'))))['total']
        purchase_revenue = Purchase.objects.filter(customer__in=customers).aggregate(total=Coalesce(Sum('amount'), Value(Decimal('0'))))['total']
        leads_by_stage = list(leads.values('stage').annotate(count=Count('id'), value=Coalesce(Sum('value'), Value(Decimal('0')))).order_by('stage'))
        monthly = list(leads.filter(stage=Lead.Stage.WON).annotate(month=TruncMonth('created_at')).values('month').annotate(revenue=Coalesce(Sum('value'), Value(Decimal('0'))), deals=Count('id')).order_by('-month')[:12])
        monthly.reverse()
        for item in monthly:
            item['month'] = item['month'].strftime('%Y-%m')
        team = []
        if request.user.role != User.Role.SALES_EXECUTIVE:
            team = list(User.objects.filter(organization_id=request.user.organization_id, role__in=[User.Role.SALES_EXECUTIVE, User.Role.SALES_MANAGER]).annotate(total_leads=Count('assigned_leads', filter=Q(assigned_leads__organization_id=request.user.organization_id)), won_deals=Count('assigned_leads', filter=Q(assigned_leads__stage=Lead.Stage.WON)), revenue=Coalesce(Sum('assigned_leads__value', filter=Q(assigned_leads__stage=Lead.Stage.WON)), Value(Decimal('0')))).values('id', 'name', 'total_leads', 'won_deals', 'revenue').order_by('-revenue'))
        return Response({'kpis': {'revenue': lead_revenue + purchase_revenue, 'leadConversionRate': round(won / total * 100) if total else 0, 'totalLeads': total, 'activeLeads': total - won - lost, 'wonLeads': won, 'lostLeads': lost, 'totalCustomers': customers.count()}, 'leadsByStage': leads_by_stage, 'monthlySales': monthly, 'teamPerformance': team, 'recentLeads': LeadSerializer(leads.select_related('assigned_to').order_by('-created_at')[:5], many=True).data})
