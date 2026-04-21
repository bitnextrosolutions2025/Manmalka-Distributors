import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Send, ShoppingBag, User, Store, CheckCircle, X } from 'lucide-react'; // Added CheckCircle and X

const Order = () => {
  // Main Customer Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerShop: '',
    customerAddress: ''
  });

  const [isLocating, setIsLocating] = useState(false);
  const [loder, setloder] = useState(false);
  
  // Custom Alert State
  const [showAlert, setShowAlert] = useState(false);

  // Products State
  const [products, setProducts] = useState([
    {
      id: Date.now(),
      saltType: 'Crystal Salt',
      quantityValue: '',
      quantityUnit: 'Kg',
      deliveryDate: ''
    }
  ]);

  // Options Data
  const saltTypes = [
    'Crystal Salt',
    'Refined salt',
    'Vacuum Salt',
    'Super Fine Salt',
    'Refine free Flow Iodised salt',
    'Low Hardness salt'
  ];

  const quantityUnits = ['Kg', 'Ton', 'Gm', 'Container', 'Bag'];

  // Handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (id, field, value) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? { ...product, [field]: value } : product
      )
    );
  };

  const addProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: Date.now(),
        saltType: 'Crystal Salt',
        quantityValue: '',
        quantityUnit: 'Kg',
        deliveryDate: ''
      }
    ]);
  };

  const removeProduct = (id) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((product) => product.id !== id));
    }
  };

  // Geolocation Fetcher
  const fetchLocation = (e) => {
    e.preventDefault();
    setIsLocating(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();

            if (data && data.display_name) {
              setFormData((prev) => ({ ...prev, customerAddress: data.display_name }));
            } else {
              setFormData((prev) => ({ ...prev, customerAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
            }
          } catch (error) {
            setFormData((prev) => ({ ...prev, customerAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
          }
          setIsLocating(false);
        },
        (error) => {
          alert("Location access denied or failed. Please enter your address manually.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setloder(true);
      
      const finalOrderData = {
        customerDetails: formData,
        orderItems: products
      };
      
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/v2/order/add-order`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify({
          customerName: formData.customerName,
          customerShop: formData.customerShop,
          customerAddress: formData.customerAddress,
          orderItems: products
        }),
      });

      const data = await res.json();
      if (data.status) {
        // Reset Form
        setFormData({
          customerName: '',
          customerShop: '',
          customerAddress: ''
        });
        setProducts([{
          id: Date.now(),
          saltType: 'Crystal Salt',
          quantityValue: '',
          quantityUnit: 'Kg',
          deliveryDate: ''
        }]);

        // Trigger Success Alert
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
        }, 3000); // Hide after 3 seconds
      }

    } catch (error) {
      console.log(error);
    } finally {
      setloder(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-18 px-4 sm:px-6 lg:px-8 font-sans text-gray-800 relative">
      
      {/* --- Beautiful Success Alert Toast --- */}
      <div 
        className={`fixed top-6 right-6 z-100 transition-all duration-500 transform ${
          showAlert ? 'translate-x-0 opacity-100 visible' : 'translate-x-full opacity-0 invisible'
        }`}
      >
        <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-2xl p-4 flex items-start gap-4 min-w-[320px]">
          <div className="bg-green-100 p-1.5 rounded-full mt-0.5">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 font-semibold text-sm">Order Successful!</h3>
            <p className="text-gray-500 text-sm mt-1">Your order has been securely saved to the database.</p>
          </div>
          <button 
            onClick={() => setShowAlert(false)} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mt-10">

        {/* Header */}
        <div className="bg-[#04469b] py-6 px-8 flex items-center gap-3">
          <ShoppingBag className="text-white w-8 h-8" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Salt Order Portal
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">

          {/* --- Customer Details Section --- */}
          <section>
            <h2 className="text-xl font-semibold text-[#04469b] mb-5 border-b-2 border-gray-100 pb-2 flex items-center gap-2">
              <User className="w-5 h-5" /> Customer Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleFormChange}
                    required
                    placeholder="John Doe"
                    className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#04469b] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Shop */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Customer Shop</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Store className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="customerShop"
                    value={formData.customerShop}
                    onChange={handleFormChange}
                    required
                    placeholder="Doe's Grocery"
                    className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#04469b] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Customer Address</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <textarea
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleFormChange}
                    required
                    rows="2"
                    placeholder="123 Market Street, City..."
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#04469b] focus:border-transparent transition-all resize-none"
                  ></textarea>
                  <button
                    type="button"
                    onClick={fetchLocation}
                    disabled={isLocating}
                    className="whitespace-nowrap flex items-center justify-center gap-2 bg-[#04469b]/10 text-[#04469b] hover:bg-[#04469b]/20 px-5 py-2.5 rounded-lg font-medium transition-colors border border-[#04469b]/30 disabled:opacity-50"
                  >
                    <MapPin className="w-4 h-4" />
                    {isLocating ? 'Fetching...' : 'Get Current Location'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* --- Order Items Section --- */}
          <section>
            <div className="flex justify-between items-end mb-5 border-b-2 border-gray-100 pb-2">
              <h2 className="text-xl font-semibold text-[#04469b] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Product Details
              </h2>
            </div>

            <div className="space-y-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative group hover:border-[#04469b]/40 transition-colors"
                >
                  {/* Remove Button (Only show if more than 1 product) */}
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded-full shadow-sm transition-transform hover:scale-105"
                      title="Remove Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">

                    {/* 1. Salt Type */}
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Product #{index + 1} Type
                      </label>
                      <select
                        value={product.saltType}
                        onChange={(e) => handleProductChange(product.id, 'saltType', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#04469b] focus:border-transparent"
                      >
                        {saltTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Quantity (Number + Unit Dropdown) */}
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <div className="flex bg-white rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-[#04469b] focus-within:border-transparent overflow-hidden">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="e.g. 50"
                          value={product.quantityValue}
                          onChange={(e) => handleProductChange(product.id, 'quantityValue', e.target.value)}
                          className="w-full px-4 py-2.5 focus:outline-none border-r border-gray-300"
                        />
                        <select
                          value={product.quantityUnit}
                          onChange={(e) => handleProductChange(product.id, 'quantityUnit', e.target.value)}
                          className="bg-gray-50 px-3 py-2.5 focus:outline-none font-medium text-gray-700 w-28 cursor-pointer"
                        >
                          {quantityUnits.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 3. Expected Delivery Date */}
                    <div className="md:col-span-4 space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        required
                        value={product.deliveryDate}
                        onChange={(e) => handleProductChange(product.id, 'deliveryDate', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#04469b] focus:border-transparent"
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Add Product Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 text-[#04469b] font-medium hover:bg-[#04469b]/5 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-[#04469b]/20"
              >
                <Plus className="w-5 h-5" /> Add Another Product
              </button>
            </div>
          </section>

          {/* Submit Action */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loder} /* Note: Changed from disabled={setloder} to disabled={loder} */
              className="w-full sm:w-auto ml-auto flex items-center justify-center gap-2 bg-[#04469b] hover:bg-[#033678] text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#04469b]/30 hover:shadow-[#04469b]/40 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loder ? (
                <>
                  {/* Loader Spinner */}
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Order
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Order;