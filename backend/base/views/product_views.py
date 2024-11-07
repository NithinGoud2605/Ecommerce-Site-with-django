from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from base.models import Product
from base.serializers import ProductSerializer
import logging

# Set up logging
logger = logging.getLogger(__name__)

@api_view(['GET'])
def getProducts(request):
    try:
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        return Response({'detail': 'Error fetching products'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def getProduct(request, pk):
    try:
        # Ensure `pk` is an integer to avoid ValueError
        product_id = int(pk)
        product = Product.objects.get(_id=product_id)
        serializer = ProductSerializer(product, many=False)
        return Response(serializer.data)
    except ValueError:
        logger.error(f"Invalid product ID format: {pk}")
        return Response({'detail': 'Invalid product ID format'}, status=status.HTTP_400_BAD_REQUEST)
    except Product.DoesNotExist:
        logger.error(f"Product with ID {pk} not found")
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Unexpected error fetching product with ID {pk}: {e}")
        return Response({'detail': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
