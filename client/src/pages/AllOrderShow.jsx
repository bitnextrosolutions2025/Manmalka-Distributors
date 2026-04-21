import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../services/authService.js';

export default function AllOrderShow() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/v2/orders/all-order`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();

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

    fetchAllOrders();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Orders</h1>
          <p className="text-gray-600 mt-2">Manage and view all your orders</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Error loading orders</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="mt-2 text-gray-600">You haven't placed any orders yet.</p>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div key={order._id || index} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Order Summary Row */}
                <div 
                  onClick={() => toggleExpand(order._id)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors border-b"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button className="flex-shrink-0">
                      {expandedOrder === order._id ? (
                        <ChevronUp className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Order ID</p>
                        <p className="text-sm font-semibold text-gray-900">{order._id?.slice(-8)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Customer</p>
                        <p className="text-sm text-gray-900">{order.customerName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Shop</p>
                        <p className="text-sm text-gray-900">{order.customerShop || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Items</p>
                        <p className="text-sm text-gray-900 font-semibold">{Array.isArray(order.orderItems) ? order.orderItems.length : 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Date of order </p>
                        <p className="text-sm text-gray-900">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div>
                         <p className="text-xs text-gray-500 font-medium">Delivary process</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.orderstatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        order.orderstatus === 'Out of Delivary' ? 'bg-blue-100 text-blue-800' :
                        order.orderstatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderstatus}
                      </span>
                    </div>
                    <div>
                         <p className="text-xs text-gray-500 font-medium">Payment</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.paymentstatus === 'Done' ? 'bg-green-100 text-green-800' :
                        order.paymentstatus === 'Due' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.paymentstatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Items Details */}
                {expandedOrder === order._id && (
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    <h4 className="font-semibold text-gray-900 mb-4">Order Items ({Array.isArray(order.orderItems) ? order.orderItems.length : 0})</h4>
                    
                    {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white border-b">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700">Item ID</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700">Product Type</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700">Quantity</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700">Unit</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-700">Expected Delivery Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {order.orderItems.map((item, itemIndex) => (
                              <tr key={item.id || itemIndex} className="hover:bg-white transition-colors">
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
                      <p className="text-gray-500 italic">No items in this order</p>
                    )}

                    {/* Order Summary */}
                    <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Customer Address</p>
                        <p className="text-sm text-gray-900">{order.customerAddress || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Order Date</p>
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
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{orders.length}</span> total orders
            </p>
          </div>
        )}
      </div>
    </div>
  );
}