import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

/**
 * Modal genérico con overlay y transiciones.
 * Reemplaza cualquier div+overlay manual en toda la app.
 *
 * Props:
 *  open      boolean
 *  onClose   () => void
 *  maxWidth  string (clase Tailwind), default 'max-w-lg'
 *  children  ReactNode
 */
export default function Modal({ open, onClose, children, maxWidth = 'max-w-lg' }) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>

        {/* Overlay — fade */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" aria-hidden="true" />
        </Transition.Child>

        {/* Panel — fade + scale sutil */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`relative w-full ${maxWidth} bg-white rounded-xl shadow-xl transform`}
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
