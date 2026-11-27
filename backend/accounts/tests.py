from django.test import TestCase
from rest_framework.test import APIClient

from .models import User


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
