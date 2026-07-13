'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { AdminLayout } from '@/components/AdminLayout';
import { Table, Badge, CustomModal, GradientButton } from '@/components/UIComponents';
import { api } from '@/lib/api';
import type { Order, OrderItem } from '@astro-shine/shared-types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [statusSelect, setStatusSelect] = useState('');

  useEffect(() => {
    api.get<Order[]>('/orders')
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleOpenDetails = async (order: Order) => {
    setSelected(order);
    setStatusSelect(order.status);
    setLoadingItems(true);
    setItems([]);
    try {
      const orderItems = await api.get<OrderItem[]>(`/orders/${order.id}/items`);
      setItems(orderItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selected) return;
    try {
      const updated = await api.put<Order>(`/orders/${selected.id}/status`, { status: statusSelect });
      setOrders(orders.map(o => o.id === selected.id ? { ...o, status: statusSelect } : o));
      setSelected({ ...selected, status: statusSelect });
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'shipped':
        return <Badge variant="info">Shipped</Badge>;
      case 'confirmed':
        return <Badge variant="info">Confirmed</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-text-primary">Orders</h1>
        <span className="text-text-secondary">{orders.length} total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-text-secondary">Loading orders...</div>
      ) : (
        <Table headers={['Order ID', 'User', 'Total Amount', 'Status', 'Date', '']} emptyMessage="No orders found">
          {orders.map(o => (
            <tr key={o.id} className="border-b border-divider hover:bg-surface-light/50">
              <td className="px-4 py-3 text-text-primary font-medium">{o.id.slice(0, 8)}...</td>
              <td className="px-4 py-3 text-text-secondary">{(o as any).userName || 'Unknown User'}</td>
              <td className="px-4 py-3 text-text-primary font-semibold">₹{o.totalAmount}</td>
              <td className="px-4 py-3">{getStatusBadge(o.status)}</td>
              <td className="px-4 py-3 text-text-muted text-sm">{formatDate(o.createdAt)}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleOpenDetails(o)}
                  className="text-primary-light hover:underline text-sm font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Order Details Modal */}
      <CustomModal open={!!selected} onClose={() => setSelected(null)} title="Order Details">
        {selected && (
          <div className="space-y-4 text-text-secondary text-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-text-primary">Order ID: {selected.id}</h3>
                <p className="text-xs text-text-muted">User: {(selected as any).userName || 'Unknown User'}</p>
              </div>
              {getStatusBadge(selected.status)}
            </div>

            <div className="border-t border-divider pt-3 space-y-1">
              <p><span className="font-medium text-text-primary">Total Amount:</span> ₹{selected.totalAmount}</p>
              <p><span className="font-medium text-text-primary">Date:</span> {formatDate(selected.createdAt)}</p>
              {selected.transactionId && (
                <p><span className="font-medium text-text-primary">Transaction ID:</span> {selected.transactionId}</p>
              )}
            </div>

            {/* Shipping Address */}
            <div className="border-t border-divider pt-3">
              <span className="font-medium text-text-primary block mb-1">Shipping Address:</span>
              {selected.shippingAddress ? (
                <div className="bg-surface-light/30 p-3 rounded-lg border border-divider">
                  <p className="font-medium text-text-primary">{selected.shippingAddress.name}</p>
                  <p>{selected.shippingAddress.addressLine1}</p>
                  {selected.shippingAddress.addressLine2 && <p>{selected.shippingAddress.addressLine2}</p>}
                  <p>{selected.shippingAddress.city}, {selected.shippingAddress.state} - {selected.shippingAddress.postalCode}</p>
                  <p>Phone: {selected.shippingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-text-muted">No shipping address details provided.</p>
              )}
            </div>

            {/* Purchased Items */}
            <div className="border-t border-divider pt-3">
              <span className="font-medium text-text-primary block mb-2">Order Items:</span>
              {loadingItems ? (
                <p className="text-text-muted text-xs">Loading items...</p>
              ) : items.length > 0 ? (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-surface-light/20 p-2.5 rounded border border-divider">
                      <div>
                        <p className="font-medium text-text-primary text-xs">Product ID: {item.productId.slice(0, 8)}...</p>
                        <p className="text-text-muted text-[11px]">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                      </div>
                      <p className="font-bold text-text-primary text-xs">₹{item.totalPrice}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted">No items found in this order.</p>
              )}
            </div>

            {/* Status Modification */}
            <div className="border-t border-divider pt-4">
              <label className="block text-text-primary font-medium mb-1">Update Order Status</label>
              <div className="flex gap-2">
                <select
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(e.target.value)}
                  className="input-field text-sm py-2 px-3"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={handleUpdateStatus}
                  className="gradient-btn py-2 px-4 text-sm font-bold shrink-0"
                  style={{ borderRadius: '16px' }}
                >
                  Update
                </button>
              </div>
            </div>

            <div className="flex gap-3 border-t border-divider pt-4">
              <GradientButton onClick={() => setSelected(null)}>Close</GradientButton>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
