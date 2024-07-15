from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import torch
from transformers import pipeline
#import subprocess
#import json
#import os

# Create your views here.
class SummarizerView(APIView):
  def post(self, request):
    try:
      text = request.GET.get('text')
      summarizer = pipeline('summarization', model='csebuetnlp/mT5_multilingual_XLSum')
      result = summarizer(text)
      return Response({'summary': result}, status=status.HTTP_200_OK)
    except Exception as e:
      return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


  def get(self, request):
    try:
      data_response = {
        "cuda_available": torch.cuda.is_available(),
        "cuda_device_count": torch.cuda.device_count(),
        "cuda_current_device": torch.cuda.current_device(),
        "cuda_device_name": torch.cuda.get_device_name(0)
  	  }
      return Response(data_response,status=status.HTTP_200_OK)
    except Exception as e:
      return Response(str(e),status=status.HTTP_400_BAD_REQUEST)