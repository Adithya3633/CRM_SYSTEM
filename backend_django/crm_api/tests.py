from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Contact, Customer, Lead, MeetingNote, Organization, Purchase, User


class LoginViewTests(TestCase):
    def setUp(self):
        organization = Organization.objects.create(name='Test organization')
        self.admin = User.objects.create_user(
            'admin@example.com',
            'password123',
            name='Admin',
            role=User.Role.ADMIN,
            organization=organization,
        )
        User.objects.create_user(
            'sales@example.com',
            'password123',
            name='Sales user',
            role=User.Role.SALES_EXECUTIVE,
            organization=organization,
        )
        self.client = APIClient()

    def test_accepts_correct_account_type(self):
        response = self.client.post(
            '/api/auth/login',
            {'email': self.admin.email, 'password': 'password123', 'account_type': 'admin'},
        )

        self.assertEqual(response.status_code, 200)

    def test_rejects_mismatched_account_type(self):
        response = self.client.post(
            '/api/auth/login',
            {'email': self.admin.email, 'password': 'password123', 'account_type': 'user'},
        )

        self.assertEqual(response.status_code, 403)

    def test_accepts_legacy_login_without_account_type(self):
        response = self.client.post(
            '/api/auth/login',
            {'email': self.admin.email, 'password': 'password123'},
        )

        self.assertEqual(response.status_code, 200)


class SeedDemoCommandTests(TestCase):
    def test_creates_demo_data_once_for_an_empty_database(self):
        call_command('seed_demo', stdout=StringIO())

        self.assertEqual(User.objects.count(), 4)
        self.assertEqual(Lead.objects.count(), 10)
        self.assertEqual(Customer.objects.count(), 4)
        self.assertEqual(Contact.objects.count(), 2)
        self.assertEqual(Purchase.objects.count(), 4)
        self.assertEqual(MeetingNote.objects.count(), 2)

        call_command('seed_demo', stdout=StringIO())

        self.assertEqual(User.objects.count(), 4)
        self.assertEqual(Organization.objects.count(), 1)
        self.assertEqual(Lead.objects.count(), 10)

    def test_seeds_demo_data_without_mixing_existing_organization(self):
        organization = Organization.objects.create(name='Existing organization')
        User.objects.create_user(
            'owner@example.com',
            'password123',
            name='Existing owner',
            role=User.Role.ADMIN,
            organization=organization,
        )

        call_command('seed_demo', stdout=StringIO())

        self.assertEqual(User.objects.count(), 5)
        self.assertEqual(Organization.objects.count(), 2)
        self.assertEqual(Lead.objects.count(), 10)
        self.assertEqual(
            User.objects.get(email='owner@example.com').organization,
            organization,
        )
