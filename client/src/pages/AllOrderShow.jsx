import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../services/authService.js';

export default function AllOrderShow() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({
    paymentstatus: '',
    orderstatus: ''
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

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

  const handleEditClick = (order) => {
    setEditingOrder(order);
    setEditFormData({
      paymentstatus: order.paymentstatus,
      orderstatus: order.orderstatus
    });
    setUpdateError('');
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setEditingOrder(null);
    setEditFormData({
      paymentstatus: '',
      orderstatus: ''
    });
    setUpdateError('');
  };

  const handleUpdateStatus = async () => {
    try {
      setUpdating(true);
      setUpdateError('');

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/v2/orders/upatePaymnetAndDelivaryStatus`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: editingOrder._id,
          paymentstatus: editFormData.paymentstatus,
          orderstatus: editFormData.orderstatus
        })
      });

      const data = await response.json();

      if (data.status) {
        // Update the orders list with the updated order
        setOrders(orders.map(order => 
          order._id === editingOrder._id ? data.data : order
        ));
        handleModalClose();
      } else {
        setUpdateError(data.message || 'Failed to update order status');
      }
    } catch (err) {
      setUpdateError(err.message || 'Failed to update order status');
      console.error('Update order error:', err);
    } finally {
      setUpdating(false);
    }
  };

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
                         <p className="text-xs text-gray-500 font-medium">Delivary Status</p>
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
                    <button
                      onClick={() => handleEditClick(order)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </button>
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

        {/* Edit Status Modal */}
        {showEditModal && editingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Update Order Status</h2>
                <button
                  onClick={handleModalClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Order ID</p>
                  <p className="text-sm font-medium text-gray-900">{editingOrder._id?.slice(-8)}</p>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-2">
                    Delivery Status
                  </label>
                  <select
                    value={editFormData.orderstatus}
                    onChange={(e) => setEditFormData({...editFormData, orderstatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="Out of Delivary">Out of Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-2">
                    Payment Status
                  </label>
                  <select
                    value={editFormData.paymentstatus}
                    onChange={(e) => setEditFormData({...editFormData, paymentstatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Due">Due</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                {updateError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{updateError}</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t flex gap-3 justify-end">
                <button
                  onClick={handleModalClose}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}