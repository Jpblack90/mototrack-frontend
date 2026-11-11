import { formatDate } from './dates';

export const COMPANY_STATUS_META = {
  active: { label: 'Activo', variant: 'success' },
  trial: { label: 'Prueba', variant: 'info' },
  grace: { label: 'Gracia', variant: 'warning' },
  suspended: { label: 'Suspendido', variant: 'destructive' },
  inactive: { label: 'Inactivo', variant: 'secondary' },
};

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'trial', label: 'En prueba' },
  { value: 'grace', label: 'En gracia' },
  { value: 'suspended', label: 'Suspendidos' },
  { value: 'inactive', label: 'Inactivos' },
];

export const PAYMENT_METHODS = [
  { value: 'yape', label: 'Yape' },
  { value: 'plin', label: 'Plin' },
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'efectivo', label: 'Efectivo' },
];

export const PLATFORM_AUDIT_ACTION_META = {
  platform_password_change: { label: 'Cambio de contraseña', variant: 'info' },
  user_password_reset: { label: 'Restablecimiento de contraseña', variant: 'warning' },
  company_suspend: { label: 'Suspensión de taller', variant: 'destructive' },
  company_reactivate: { label: 'Reactivación de taller', variant: 'success' },
  subscription_payment: { label: 'Pago de suscripción', variant: 'success' },
};

export function getCompanyStatusMeta(status) {
  return COMPANY_STATUS_META[status] || { label: status || 'Desconocido', variant: 'outline' };
}

export function getPaymentMethodLabel(method) {
  const found = PAYMENT_METHODS.find((item) => item.value === method);
  return found ? found.label : method || '—';
}

export function getPlatformAuditActionMeta(action) {
  return PLATFORM_AUDIT_ACTION_META[action] || { label: action || 'Evento', variant: 'outline' };
}

export function formatPen(amount) {
  const numeric = Number(amount ?? 0);
  if (!Number.isFinite(numeric)) return 'S/ 0.00';
  return `S/ ${numeric.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQuota(used, max) {
  const current = Number(used ?? 0);
  return `${current} / ${max !== null && max !== undefined ? max : '∞'}`;
}

export function formatCompanyExpiration(company) {
  if (!company) return { dateLabel: '—', detailLabel: '' };

  const status = company.subscription_status;
  if (status === 'trial' && company.trial_ends_at) {
    const days = company.days_left;
    return {
      dateLabel: formatDate(company.trial_ends_at),
      detailLabel: days !== null && days !== undefined ? `${days} d de prueba` : 'Periodo de prueba',
    };
  }

  if (company.paid_until) {
    const dateLabel = formatDate(company.paid_until);
    if (status === 'grace') {
      return {
        dateLabel,
        detailLabel: `Gracia: ${company.grace_days_left ?? 0} d`,
      };
    }
    if (status === 'suspended') {
      return {
        dateLabel,
        detailLabel: 'Vencido',
      };
    }
    if (company.days_left !== null && company.days_left !== undefined) {
      return {
        dateLabel,
        detailLabel: `${company.days_left} d restantes`,
      };
    }
    return { dateLabel, detailLabel: '' };
  }

  if (company.trial_ends_at) {
    return { dateLabel: formatDate(company.trial_ends_at), detailLabel: '' };
  }

  return { dateLabel: '—', detailLabel: '' };
}
