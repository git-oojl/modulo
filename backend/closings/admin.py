from django.contrib import admin

from .models import Closing, CommissionEstimate

admin.site.register(Closing)
admin.site.register(CommissionEstimate)
