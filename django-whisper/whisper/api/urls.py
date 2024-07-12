from django.urls import path
from .views import *

urlpatterns = [
    path('transcribe/', TranscriberView.as_view(), name='transcribe'),
]