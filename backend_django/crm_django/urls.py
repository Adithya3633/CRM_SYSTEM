from django.urls import include, path

urlpatterns = [
    path('api/', include('crm_api.urls')),
]
