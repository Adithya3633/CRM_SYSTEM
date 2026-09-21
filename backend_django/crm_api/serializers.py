from rest_framework import serializers
from .models import Contact, Customer, Lead, MeetingNote, Organization, Purchase, User


class UserSerializer(serializers.ModelSerializer):
    organization_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'organization_id']


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'industry', 'address', 'phone', 'email']


class LeadSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='assigned_to.name', read_only=True, allow_null=True)
    organization_id = serializers.IntegerField(read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)

    class Meta:
        model = Lead
        fields = ['id', 'name', 'email', 'phone', 'company', 'stage', 'value', 'source', 'notes', 'organization_id', 'assigned_to', 'assigned_name', 'created_at', 'updated_at']


class ContactSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Contact
        fields = ['id', 'customer_id', 'name', 'email', 'phone', 'role', 'is_primary']


class PurchaseSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Purchase
        fields = ['id', 'customer_id', 'product', 'amount', 'purchase_date', 'notes']


class MeetingNoteSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(read_only=True)
    user_id = serializers.IntegerField(read_only=True)
    author_name = serializers.CharField(source='user.name', read_only=True, allow_null=True)

    class Meta:
        model = MeetingNote
        fields = ['id', 'customer_id', 'user_id', 'title', 'content', 'meeting_date', 'author_name', 'created_at']


class CustomerSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='assigned_to.name', read_only=True, allow_null=True)
    organization_id = serializers.IntegerField(read_only=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)
    contacts = ContactSerializer(many=True, read_only=True)
    purchases = PurchaseSerializer(many=True, read_only=True)
    meeting_notes = MeetingNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'company', 'address', 'status', 'organization_id', 'assigned_to', 'assigned_name', 'created_at', 'updated_at', 'contacts', 'purchases', 'meeting_notes']
