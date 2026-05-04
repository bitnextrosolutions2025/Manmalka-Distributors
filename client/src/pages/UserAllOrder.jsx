import React, { useEffect, useState } from 'react';
import { Loader, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function UserAllOrder() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        const fetchUserAllOrder = async () => {
            try {
                setLoading(true);
                setError('');
                const url = `${import.meta.env.VITE_BACKEND_URL}/api/v2/orders/getuserorder`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                const data = await res.json();
                if (data.status) {
                    setOrders(data.data || []);
                } else {
                    setError(data.message || 'Failed to load orders');
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch orders. Please try again.');
                console.error('Fetch orders error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserAllOrder();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-3">
                    <Loader className="h-12 w-12 text-blue-600 animate-spin" />
                    <p className="text-gray-600 font-medium">Loading orders...</p>
                </div>
            </div>
        );
    }

    const toggleExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-6 sm:mb-8 text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Orders</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">Manage and view all your orders</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        <div>
                            <p className="font-medium text-red-900">Error loading orders</p>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!error && orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-8 sm:p-12 text-center border border-gray-100">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                            <CheckCircle className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No orders yet</h3>
                        <p className="mt-2 text-sm sm:text-base text-gray-600">You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    /* Orders List */
                    <div className="space-y-4">
                        {orders.map((order, index) => (
                            <div key={order._id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">

                                {/* Order Summary Row */}
                                <div
                                    onClick={() => toggleExpand(order._id)}
                                    className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors border-b gap-4"
                                    aria-expanded={expandedOrder === order._id}
                                >
                                    <div className="flex items-start lg:items-center gap-3 sm:gap-4 flex-1 w-full">
                                        <button
                                            type="button"
                                            className="mt-1 lg:mt-0 shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
                                        >
                                            {expandedOrder === order._id ? (
                                                <ChevronUp className="h-5 w-5 text-gray-600" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-600" />
                                            )}
                                        </button>

                                        {/* Responsive Grid for Order Info */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-4 gap-x-4 w-full">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Order ID</p>
                                                <p className="text-sm font-semibold text-gray-900 mt-1 truncate" title={order._id}>
                                                    {order._id?.slice(-8)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Customer</p>
                                                <p className="text-sm text-gray-900 mt-1 truncate">{order.customerName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Shop</p>
                                                <p className="text-sm text-gray-900 mt-1 truncate">{order.customerShop || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Items</p>
                                                <p className="text-sm text-gray-900 font-semibold mt-1">
                                                    {Array.isArray(order.orderItems) ? order.orderItems.length : 0}
                                                </p>
                                            </div>
                                            <div className="col-span-2 sm:col-span-1">
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Order Date</p>
                                                <p className="text-sm text-gray-900 mt-1">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 pl-9 sm:pl-10 lg:pl-0 shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center min-w-25 ${order.orderstatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                order.orderstatus === 'Out of Delivery' ? 'bg-blue-100 text-blue-800' :
                                                    order.orderstatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                            }`}>
                                            {order.orderstatus || 'Unknown'}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center min-w-25 ${order.paymentstatus === 'Done' ? 'bg-green-100 text-green-800' :
                                                order.paymentstatus === 'Due' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {order.paymentstatus || 'Unknown'}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded Items Details */}
                                {expandedOrder === order._id && (
                                    <div className="p-4 sm:p-6 bg-gray-50 border-t">
                                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            Order Items
                                            <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                                                {Array.isArray(order.orderItems) ? order.orderItems.length : 0}
                                            </span>
                                        </h4>

                                        {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
                                            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                                                <table className="w-full text-sm text-left whitespace-nowrap">
                                                    <thead className="bg-gray-50 border-b">
                                                        <tr>
                                                            <th className="px-4 py-3 font-semibold text-gray-700">Item ID</th>
                                                            <th className="px-4 py-3 font-semibold text-gray-700">Product Type</th>
                                                            <th className="px-4 py-3 font-semibold text-gray-700">Quantity</th>
                                                            <th className="px-4 py-3 font-semibold text-gray-700">Unit</th>
                                                            <th className="px-4 py-3 font-semibold text-gray-700">Expected Delivery</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {order.orderItems.map((item, itemIndex) => (
                                                            <tr key={item.id || itemIndex} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 text-gray-600 font-medium">{item.id || `Item-${itemIndex + 1}`}</td>
                                                                <td className="px-4 py-3 text-gray-600">{item.saltType || 'N/A'}</td>
                                                                <td className="px-4 py-3 text-gray-600 font-semibold">{item.quantityValue || '0'}</td>
                                                                <td className="px-4 py-3 text-gray-600">{item.quantityUnit || 'N/A'}</td>
                                                                <td className="px-4 py-3 text-gray-600">
                                                                    {item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    }) : 'N/A'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                                                <p className="text-gray-500 italic">No items found in this order</p>
                                            </div>
                                        )}

                                        {/* Order Summary / Details Footer */}
                                        <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Shipping Address</p>
                                                <p className="text-sm text-gray-900 wrap-break-word">{order.customerAddress || 'N/A'}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Full Order Date & Time</p>
                                                <p className="text-sm text-gray-900">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Footer */}
                {!error && orders.length > 0 && (
                    <div className="mt-6 sm:mt-8 bg-white border border-gray-200 rounded-lg shadow-sm p-4 text-center sm:text-left">
                        <p className="text-sm text-gray-600">
                            Showing <span className="font-semibold text-gray-900">{orders.length}</span> total orders
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}