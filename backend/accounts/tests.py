from django.test import TestCase
from rest_framework.test import APIClient

from .models import AccessRequest, User


class SessionAuthenticationTests(TestCase):
    def test_login_acepta_correo_y_retorna_usuario_publico(self):
        user = User.objects.create_user(
            username="asesora",
            email="asesora@example.test",
            password="DemoPassword123!",
            role=User.Role.ADVISOR,
        )

        response = APIClient().post(
            "/api/v1/auth/login/",
            {"username": "asesora@example.test", "password": "DemoPassword123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], str(user.public_id))
        self.assertNotIn("password", response.json())


class AccessRequestTests(TestCase):
    def test_solicitud_publica_exige_aviso_y_administrador_puede_aprobarla(self):
        client = APIClient()
        rejected = client.post(
            "/api/v1/auth/access-requests/",
            {"name": "María López", "email": "maria@example.test", "requested_role": "asesor", "privacy_accepted": False},
            format="json",
        )
        self.assertEqual(rejected.status_code, 400)

        created = client.post(
            "/api/v1/auth/access-requests/",
            {"name": "María López", "email": "maria@example.test", "phone": "6641234567", "requested_role": "asesor", "privacy_accepted": True},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        request = AccessRequest.objects.get(public_id=created.json()["id"])
        self.assertEqual(request.status, AccessRequest.Status.PENDING)

        admin = User.objects.create_superuser(username="admin", email="admin@example.test", password="DemoPassword123!")
        client.force_authenticate(admin)
        approved = client.post(f"/api/v1/users/access-requests/{request.public_id}/approve/", format="json")
        self.assertEqual(approved.status_code, 200)
        request.refresh_from_db()
        self.assertEqual(request.status, AccessRequest.Status.APPROVED)
        self.assertEqual(request.reviewed_by, admin)
