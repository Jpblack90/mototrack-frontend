import ProductDialog from './ProductDialog';

export default function ManualProductModal({ mode = 'create', initialData, onSuccess, onClose }) {
  return (
    <ProductDialog
      open={true}
      mode={mode}
      initialData={initialData}
      onSuccess={onSuccess}
      onClose={onClose}
      defaultTab="manual"
    />
  );
}
