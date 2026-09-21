from django.contrib import admin
from .models import Contact, Customer, Lead, MeetingNote, Organization, Purchase, User


@admin.register(User)
class CrmUserAdmin(admin.ModelAdmin):
	list_display = ('email', 'name', 'role', 'organization', 'is_active', 'is_staff')
	search_fields = ('email', 'name')
	list_filter = ('role', 'is_active', 'is_staff')


admin.site.register([Organization, Customer, Lead, Contact, Purchase, MeetingNote])
