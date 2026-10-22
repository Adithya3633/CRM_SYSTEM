from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from .models import Contact, Customer, Lead, MeetingNote, Organization, Purchase, User


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
