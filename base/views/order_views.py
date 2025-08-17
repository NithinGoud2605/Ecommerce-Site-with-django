import logging
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
from base.models import Product, Order, OrderItem, ShippingAddress
from base.serializers import OrderSerializer

# Set up a logger
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def addOrderItems(request):
    user = request.user
    data = request.data

    print("Incoming order data:", data)  # Debugging: print incoming data

    try:
        # Validate that order items are present
        orderItems = data.get('orderItems', [])
        if not orderItems:
            return Response({'detail': 'No Order Items'}, status=status.HTTP_400_BAD_REQUEST)

        # Create the order
        order = Order.objects.create(
            user=user,
            paymentMethod=data['paymentMethod'],
            taxPrice=data['taxPrice'],
            shippingPrice=data['shippingPrice'],
            totalPrice=data['totalPrice'],
            createdAt=datetime.now()  # Ensure createdAt is populated
        )
        print("Order created with ID:", order._id)

        # Create the shipping address
        shipping = ShippingAddress.objects.create(
            order=order,
            address=data['shippingAddress']['address'],
            city=data['shippingAddress']['city'],
            postalCode=data['shippingAddress']['postalCode'],
            country=data['shippingAddress']['country'],
        )
        print("Shipping address created for order ID:", order._id)

        # Create order items and update stock
        for i in orderItems:
            product = Product.objects.get(_id=i['product'])
            print("Processing product:", product.name)

            OrderItem.objects.create(
                product=product,
                order=order,
                name=product.name,
                qty=i['qty'],
                price=i['price'],
                image=product.image.url,
            )
            print(f"Order item created for product {product.name}")

            # Update stock
            product.countInStock -= i['qty']
            product.save()
            print(f"Stock updated for {product.name}, new stock: {product.countInStock}")

        serializer = OrderSerializer(order, many=False)
        return Response(serializer.data)

    except Product.DoesNotExist as e:
        print("Product not found:", str(e))
        return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print("Unexpected error:", str(e))
        return Response({'detail': 'An unexpected error occurred', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getMyOrders(request):
    user = request.user
    try:
        orders = user.order_set.all()
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Failed to retrieve user orders: {str(e)}")
        return Response({'detail': 'Failed to retrieve user orders'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def getOrders(request):
    try:
        orders = Order.objects.all()
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Failed to retrieve all orders: {str(e)}")
        return Response({'detail': 'Failed to retrieve all orders'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def ordersAnalytics(request):
    """Return simple aggregates for the dashboard charts.
    Query: ?days=30 (default 30)
    """
    try:
        try:
            days = int(request.query_params.get('days', 30))
        except Exception:
            days = 30
        cutoff = datetime.now() - timedelta(days=days if days > 0 else 3650)
        qs = Order.objects.filter(createdAt__gte=cutoff).order_by('createdAt')
        items = []
        total_sales = 0
        paid = 0
        delivered = 0
        low_stock = 0
        for o in qs:
            items.append({
                'id': o._id,
                'createdAt': o.createdAt,
                'totalPrice': float(o.totalPrice or 0),
                'isPaid': bool(o.isPaid),
                'isDelivered': bool(o.isDelivered),
            })
            total_sales += float(o.totalPrice or 0)
            if o.isPaid: paid += 1
            if o.isDelivered: delivered += 1

        # low stock quick stat
        low_stock = Product.objects.filter(countInStock__gt=0, countInStock__lt=5).count()

        return Response({
            'orders': items,
            'totals': {
                'sales': total_sales,
                'paidCount': paid,
                'deliveredCount': delivered,
                'lowStockCount': low_stock,
            }
        })
    except Exception as e:
        logger.error(f"ordersAnalytics failed: {str(e)}")
        return Response({'detail': 'Failed to compute analytics'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getOrderById(request, pk):
    user = request.user
    try:
        order = Order.objects.get(_id=pk)
        if user.is_staff or order.user == user:
            serializer = OrderSerializer(order, many=False)
            return Response(serializer.data)
        else:
            return Response({'detail': 'Not authorized to view this order'}, status=status.HTTP_403_FORBIDDEN)
    except Order.DoesNotExist:
        logger.error("Order not found")
        return Response({'detail': 'Order does not exist'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return Response({'detail': 'An error occurred', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateOrderToPaid(request, pk):
    try:
        order = Order.objects.get(_id=pk)

        order.isPaid = True
        order.paidAt = datetime.now()
        order.save()

        return Response({'detail': 'Order was paid'})
    except Order.DoesNotExist:
        logger.error("Order not found")
        return Response({'detail': 'Order does not exist'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return Response({'detail': 'An error occurred', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def updateOrderToDelivered(request, pk):
    try:
        order = Order.objects.get(_id=pk)

        order.isDelivered = True
        order.deliveredAt = datetime.now()
        order.save()

        return Response({'detail': 'Order was delivered'})
    except Order.DoesNotExist:
        logger.error("Order not found")
        return Response({'detail': 'Order does not exist'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return Response({'detail': 'An error occurred', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def refundOrder(request, pk):
    try:
        order = Order.objects.get(_id=pk)
        amount = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'detail': 'Invalid refund amount'}, status=status.HTTP_400_BAD_REQUEST)
        prev = float(order.refundTotal or 0)
        order.refundTotal = prev + amount
        order.refundedAt = datetime.now()
        order.save()
        return Response({'detail': 'Order refunded', 'refundTotal': order.refundTotal})
    except Order.DoesNotExist:
        logger.error("Order not found")
        return Response({'detail': 'Order does not exist'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        return Response({'detail': 'An error occurred', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
