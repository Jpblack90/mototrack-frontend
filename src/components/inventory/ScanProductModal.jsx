import ProductDialog from './ProductDialog';

export default function ScanProductModal({ onSuccess, onClose }) {
  return (
    <ProductDialog
      open={true}
      mode="create"
      onSuccess={onSuccess}
      onClose={onClose}
      defaultTab="scan"
    />
  );
}
