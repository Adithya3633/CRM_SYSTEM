from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models


class Organization(models.Model):
    name = models.CharField(max_length=200)
    industry = models.CharField(max_length=200, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        SALES_MANAGER = 'sales_manager', 'Sales Manager'
        SALES_EXECUTIVE = 'sales_executive', 'Sales Executive'

    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.SALES_EXECUTIVE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='users', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ['name']


class Customer(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    company = models.CharField(max_length=200, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=30, default='active')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='customers')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Lead(models.Model):
    class Stage(models.TextChoices):
        NEW = 'new', 'New'
        CONTACTED = 'contacted', 'Contacted'
        QUALIFIED = 'qualified', 'Qualified'
        PROPOSAL_SENT = 'proposal_sent', 'Proposal Sent'
        WON = 'won', 'Won'
        LOST = 'lost', 'Lost'

    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    company = models.CharField(max_length=200, blank=True, null=True)
    stage = models.CharField(max_length=30, choices=Stage.choices, default=Stage.NEW)
    value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    source = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='leads')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_leads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Contact(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    is_primary = models.BooleanField(default=False)


class Purchase(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='purchases')
    product = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    purchase_date = models.DateField()
    notes = models.TextField(blank=True, null=True)


class MeetingNote(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='meeting_notes')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='meeting_notes')
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, null=True)
    meeting_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
