from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger  # Import for pagination
from django.db.models import Q  
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from base.models import Product, Review, ProductVariant, ProductMedia, Collection, CollectionEntry, ProductMediaLink
from base.serializers import ProductSerializer, ProductVariantSerializer, ProductMediaSerializer, CollectionSerializer, CollectionEntrySerializer, ProductMediaLinkSerializer
from django.core.paginator import Paginator
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
def getProducts(request):
    query = request.query_params.get('keyword', '')
    sort_by = request.query_params.get('sort_by', 'name')  # Default sort by name
    order = request.query_params.get('order', 'asc')  # Default order ascending

    products = Product.objects.filter(name__icontains=query)

    # Sorting logic
    if sort_by in ['price', 'rating', 'name']:
        if order == 'desc':
            sort_by = f'-{sort_by}'
        products = products.order_by(sort_by)
    else:
        # Default sorting
        products = products.order_by('name')

    # Pagination
    page = request.query_params.get('page', 1)
    paginator = Paginator(products, 8)

    try:
        products = paginator.page(page)
    except (EmptyPage, PageNotAnInteger):
        products = paginator.page(1)

    page = int(page)
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response({'products': serializer.data, 'page': page, 'pages': paginator.num_pages})

@api_view(['GET'])
def getProduct(request, pk):
    try:
        product = Product.objects.get(_id=pk)
        serializer = ProductSerializer(product, many=False, context={'request': request})
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error fetching product with ID {pk}: {e}")
        return Response({'detail': 'Error fetching product'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def createProduct(request):
    try:
        user = request.user
        product = Product.objects.create(
            user=user,
            name='Sample Name',
            price=0,
            countInStock=0,
            description=''
        )
        serializer = ProductSerializer(product, many=False, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        return Response({'detail': 'Error creating product'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteProduct(request, pk):
    try:
        product = Product.objects.get(_id=pk)
        product.delete()
        return Response({'detail': 'Product deleted successfully'}, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error deleting product with ID {pk}: {e}")
        return Response({'detail': 'Error deleting product'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateProduct(request, pk):
    data = request.data
    product = Product.objects.get(_id=pk)

    product.name = data['name']
    product.price = data['price']
    product.countInStock = data['countInStock']
    product.description = data['description']

    product.save()

    serializer = ProductSerializer(product, many=False, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
def uploadImage(request):
    data = request.data

    product_id = data.get('product_id')
    product = Product.objects.get(_id=product_id)

    if 'image' in request.FILES:
        product.image = request.FILES['image']
        product.save()
        serializer = ProductSerializer(product, many=False, context={'request': request})
        return Response(serializer.data)
    else:
        return Response({'detail': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)


# Admin: variants
@api_view(['GET'])
@permission_classes([IsAdminUser])
def listVariants(request):
    qs = ProductVariant.objects.all()
    product_id = request.query_params.get('product_id')
    if product_id:
        qs = qs.filter(product_id=product_id)
    sort_by = request.query_params.get('sort_by', 'product_id')
    order = request.query_params.get('order', 'asc')
    if order == 'desc':
        sort_by = f'-{sort_by}'
    qs = qs.order_by(sort_by)
    page_size = int(request.query_params.get('page_size', 50))
    page = int(request.query_params.get('page', 1))
    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)
    serializer = ProductVariantSerializer(page_obj.object_list, many=True)
    return Response({ 'results': serializer.data, 'page': page_obj.number, 'pages': paginator.num_pages, 'count': paginator.count })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def createVariant(request):
    serializer = ProductVariantSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateVariant(request, pk):
    variant = ProductVariant.objects.get(pk=pk)
    serializer = ProductVariantSerializer(variant, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteVariant(request, pk):
    variant = ProductVariant.objects.get(pk=pk)
    variant.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# Admin: media
@api_view(['GET'])
@permission_classes([IsAdminUser])
def listMedia(request):
    qs = ProductMedia.objects.all()
    role = request.query_params.get('role')
    if role:
        qs = qs.filter(role=role)
    sort_by = request.query_params.get('sort_by', 'position')
    order = request.query_params.get('order', 'asc')
    if order == 'desc':
        sort_by = f'-{sort_by}'
    qs = qs.order_by(sort_by)
    page_size = int(request.query_params.get('page_size', 50))
    page = int(request.query_params.get('page', 1))
    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)
    serializer = ProductMediaSerializer(page_obj.object_list, many=True, context={'request': request})
    return Response({ 'results': serializer.data, 'page': page_obj.number, 'pages': paginator.num_pages, 'count': paginator.count })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def createMedia(request):
    serializer = ProductMediaSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateMedia(request, pk):
    media = ProductMedia.objects.get(pk=pk)
    serializer = ProductMediaSerializer(media, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteMedia(request, pk):
    media = ProductMedia.objects.get(pk=pk)
    media.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# Admin: collections
@api_view(['GET'])
@permission_classes([IsAdminUser])
def listCollections(request):
    qs = Collection.objects.all()
    sort_by = request.query_params.get('sort_by', 'createdAt')
    order = request.query_params.get('order', 'desc')
    if order == 'desc':
        sort_by = f'-{sort_by}'
    qs = qs.order_by(sort_by)
    page_size = int(request.query_params.get('page_size', 50))
    page = int(request.query_params.get('page', 1))
    paginator = Paginator(qs, page_size)
    page_obj = paginator.get_page(page)
    serializer = CollectionSerializer(page_obj.object_list, many=True, context={'request': request})
    return Response({ 'results': serializer.data, 'page': page_obj.number, 'pages': paginator.num_pages, 'count': paginator.count })


# Admin: product-media links
@api_view(['GET'])
@permission_classes([IsAdminUser])
def listProductMediaLinks(request, product_pk):
    qs = ProductMediaLink.objects.filter(product_id=product_pk).order_by('position', 'id')
    serializer = ProductMediaLinkSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def createProductMediaLink(request, product_pk):
    data = { **request.data, 'product': product_pk }
    serializer = ProductMediaLinkSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateProductMediaLink(request, pk):
    link = ProductMediaLink.objects.get(pk=pk)
    serializer = ProductMediaLinkSerializer(link, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteProductMediaLink(request, pk):
    link = ProductMediaLink.objects.get(pk=pk)
    link.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def reorderProductMedia(request, product_pk):
    """
    Accepts { order: [link_id_in_new_order...] } and rewrites position.
    """
    try:
        order = request.data.get('order', [])
        if not isinstance(order, list):
            return Response({'detail': 'order must be a list of ids'}, status=status.HTTP_400_BAD_REQUEST)
        for pos, link_id in enumerate(order):
            try:
                ProductMediaLink.objects.filter(id=link_id, product_id=product_pk).update(position=pos)
            except Exception:
                continue
        qs = ProductMediaLink.objects.filter(product_id=product_pk).order_by('position', 'id')
        serializer = ProductMediaLinkSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error reordering media for product {product_pk}: {e}")
        return Response({'detail':'Failed to reorder'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def createCollection(request):
    serializer = CollectionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateCollection(request, pk):
    obj = Collection.objects.get(pk=pk)
    serializer = CollectionSerializer(obj, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteCollection(request, pk):
    obj = Collection.objects.get(pk=pk)
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def listCollectionEntries(request, collection_pk):
    qs = CollectionEntry.objects.filter(collection_id=collection_pk).order_by('position')
    serializer = CollectionEntrySerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def createCollectionEntry(request, collection_pk):
    data = { **request.data, 'collection': collection_pk }
    serializer = CollectionEntrySerializer(data=data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateCollectionEntry(request, pk):
    entry = CollectionEntry.objects.get(pk=pk)
    serializer = CollectionEntrySerializer(entry, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def deleteCollectionEntry(request, pk):
    entry = CollectionEntry.objects.get(pk=pk)
    entry.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createProductReview(request, pk):
    try:
        user = request.user
        product = Product.objects.get(_id=pk)
        data = request.data

        # 1 - Check if Review Already Exists
        alreadyExists = product.review_set.filter(user=user).exists()
        if alreadyExists:
            return Response({'detail': 'Product already reviewed'}, status=status.HTTP_400_BAD_REQUEST)

        # 2 - Validate Rating
        if 'rating' not in data or data['rating'] == 0:
            return Response({'detail': 'Please select a rating'}, status=status.HTTP_400_BAD_REQUEST)

        # 3 - Create Review
        review = Review.objects.create(
            user=user,
            product=product,
            name=user.first_name,
            rating=data['rating'],
            comment=data.get('comment', ''),
        )

        # Update Product Reviews Count and Rating
        reviews = product.review_set.all()
        product.numReviews = reviews.count()
        product.rating = sum([rev.rating for rev in reviews]) / reviews.count()
        product.save()

        return Response({'detail': 'Review added successfully'}, status=status.HTTP_201_CREATED)
    except Product.DoesNotExist:
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error creating review for product with ID {pk}: {e}")
        return Response({'detail': 'Error creating review'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
