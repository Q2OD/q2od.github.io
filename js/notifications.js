/**
 * Custom Notification System
 * Replaces browser alerts with professional modals
 */

class NotificationSystem {
  constructor() {
    this.createContainer();
  }

  createContainer() {
    if (document.getElementById('notification-container')) return;

    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };

    const colors = {
      success: 'bg-green-600/90',
      error: 'bg-red-600/90',
      warning: 'bg-yellow-600/90',
      info: 'bg-blue-600/90'
    };

    notification.innerHTML = `
      <div class="${colors[type]} backdrop-blur-xl text-white px-5 py-4 rounded-xl shadow-glow border border-white/10 flex items-start gap-3 animate-slideIn">
        <span class="text-2xl flex-shrink-0">${icons[type]}</span>
        <div class="flex-1 text-sm leading-relaxed whitespace-pre-line">${message}</div>
        <button class="close-btn text-white/60 hover:text-white transition-colors text-xl leading-none" aria-label="Close">×</button>
      </div>
    `;

    const container = document.getElementById('notification-container');
    container.appendChild(notification);

    // Close button
    const closeBtn = notification.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      this.remove(notification);
    });

    // Auto-close
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }

    return notification;
  }

  remove(notification) {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  success(message, duration = 5000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 7000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 6000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }

  confirm(message, onConfirm, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'notification-modal';
    modal.innerHTML = `
      <div class="fixed inset-0 z-[10000] flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div class="bg-ink border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-glow animate-scaleIn">
          <div class="text-lg mb-4 whitespace-pre-line">${message}</div>
          <div class="flex gap-3 justify-end">
            <button class="cancel-btn px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
              Cancel
            </button>
            <button class="confirm-btn px-5 py-2.5 bg-gradient-to-r from-blaze to-blaze2 rounded-lg font-semibold hover:shadow-glow transition-all">
              Confirm
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const confirmBtn = modal.querySelector('.confirm-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    confirmBtn.addEventListener('click', () => {
      modal.remove();
      if (onConfirm) onConfirm();
    });

    cancelBtn.addEventListener('click', () => {
      modal.remove();
      if (onCancel) onCancel();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal.firstElementChild) {
        modal.remove();
        if (onCancel) onCancel();
      }
    });

    return modal;
  }
}

// Add animations
if (!document.getElementById('notification-styles')) {
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from {
        transform: scale(0.9);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

// Global instance
window.notify = new NotificationSystem();
