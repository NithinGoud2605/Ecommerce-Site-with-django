from pathlib import Path
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

BASE_DIR = Path(__file__).resolve().parent.parent

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='index.html')),  # Ensure 'index.html' is in the correct path

    # API endpoints
    path('api/products/', include('base.urls.product_urls')),
    path('api/users/', include('base.urls.user_urls')),
    path('api/orders/', include('base.urls.order_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=BASE_DIR / 'frontend/dist')
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)  # Ensure media files are served
