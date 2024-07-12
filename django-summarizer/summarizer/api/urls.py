from django.urls import path
from .views import *

urlpatterns = [
    path('summarize/', SummarizerView.as_view(), name='summarize'),
]
