from django.urls import path
from base.views import product_views as views

urlpatterns = [
    # Admin catalog endpoints (declare first to avoid conflicts)
    path('variants/', views.listVariants, name='variants-list'),
    path('variants/create/', views.createVariant, name='variant-create'),
    path('variants/<int:pk>/', views.updateVariant, name='variant-update'),
    path('variants/<int:pk>/delete/', views.deleteVariant, name='variant-delete'),

    path('media/', views.listMedia, name='media-list'),
    path('media/create/', views.createMedia, name='media-create'),
    path('media/<int:pk>/', views.updateMedia, name='media-update'),
    # Friendly alias for alt updates used by admin modal
    path('media/<int:pk>/', views.updateMedia, name='product-media-update'),
    path('media/<int:pk>/delete/', views.deleteMedia, name='media-delete'),

    path('collections/', views.listCollections, name='collections-list'),
    path('collections/create/', views.createCollection, name='collection-create'),
    path('collections/<int:pk>/', views.updateCollection, name='collection-update'),
    path('collections/<int:pk>/delete/', views.deleteCollection, name='collection-delete'),
    path('collections/<int:collection_pk>/entries/', views.listCollectionEntries, name='collection-entries'),
    path('collections/<int:collection_pk>/entries/create/', views.createCollectionEntry, name='collection-entry-create'),
    path('collections/entries/<int:pk>/', views.updateCollectionEntry, name='collection-entry-update'),
    path('collections/entries/<int:pk>/delete/', views.deleteCollectionEntry, name='collection-entry-delete'),

    # Product-media links
    path('<int:product_pk>/media-links/', views.listProductMediaLinks, name='product-media-links'),
    path('<int:product_pk>/media-links/create/', views.createProductMediaLink, name='product-media-link-create'),
    path('media-links/<int:pk>/', views.updateProductMediaLink, name='product-media-link-update'),
    path('media-links/<int:pk>/delete/', views.deleteProductMediaLink, name='product-media-link-delete'),
    path('<int:product_pk>/media-links/reorder/', views.reorderProductMedia, name='product-media-reorder'),

    # Public product endpoints
    path('', views.getProducts, name='products'),
    path('create/', views.createProduct, name='product-create'),
    path('upload/', views.uploadImage, name="image-upload"),
    path('<int:pk>/reviews/', views.createProductReview, name="create-review"),
    path('<int:pk>/', views.getProduct, name='product'),
    path('update/<int:pk>/', views.updateProduct, name='product-update'),
    path('delete/<int:pk>/', views.deleteProduct, name='product-delete'),
]
