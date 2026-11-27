from django.urls import path

from .views import csrf, me, session_login, session_logout

urlpatterns = [
    path("csrf/", csrf, name="csrf"),
    path("login/", session_login, name="session-login"),
    path("logout/", session_logout, name="session-logout"),
    path("me/", me, name="current-user"),
]
