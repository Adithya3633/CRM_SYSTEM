from django.urls import path
from .views import CustomerDetailView, CustomerRelatedView, CustomersView, DashboardView, HealthView, LeadDetailView, LeadStageView, LeadsView, LoginView, MeView, OrganizationView, RegisterView, UserDetailView, UsersView

urlpatterns = [
    path('health', HealthView.as_view()),
    path('auth/register', RegisterView.as_view()),
    path('auth/login', LoginView.as_view()),
    path('auth/me', MeView.as_view()),
    path('auth/users', UsersView.as_view()),
    path('auth/users/<int:pk>', UserDetailView.as_view()),
    path('organization', OrganizationView.as_view()),
    path('leads', LeadsView.as_view()),
    path('leads/<int:pk>', LeadDetailView.as_view()),
    path('leads/<int:pk>/stage', LeadStageView.as_view()),
    path('customers', CustomersView.as_view()),
    path('customers/<int:pk>', CustomerDetailView.as_view()),
    path('customers/<int:pk>/<str:related>', CustomerRelatedView.as_view()),
    path('dashboard', DashboardView.as_view()),
]
