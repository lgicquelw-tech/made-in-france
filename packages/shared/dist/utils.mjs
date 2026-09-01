// src/utils/index.ts
function slugify(text) {
  return text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}
function formatPriceRange(min, max, currency = "EUR") {
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  if (min != null && max != null) {
    if (min === max) {
      return formatter.format(min);
    }
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min != null) {
    return `\xC0 partir de ${formatter.format(min)}`;
  }
  if (max != null) {
    return `Jusqu'\xE0 ${formatter.format(max)}`;
  }
  return "Prix non communiqu\xE9";
}
function formatPrice(price, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
}
function formatNumber(num) {
  return new Intl.NumberFormat("fr-FR").format(num);
}
function formatDate(date, options = {
  year: "numeric",
  month: "long",
  day: "numeric"
}) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", options).format(d);
}
function formatRelativeDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1e3 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1e3 * 60));
      if (diffMinutes === 0) {
        return "\xC0 l'instant";
      }
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    }
    return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
  }
  if (diffDays === 1) {
    return "Hier";
  }
  if (diffDays < 7) {
    return `Il y a ${diffDays} jours`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? "s" : ""}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Il y a ${months} mois`;
  }
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} an${years > 1 ? "s" : ""}`;
}
function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function toRad(deg) {
  return deg * (Math.PI / 180);
}
function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1e3)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}
function isEmpty(value) {
  if (value === null || value === void 0) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
function throttle(fn, limit) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
function buildUrl(baseUrl, params) {
  const url = new URL(baseUrl, "http://placeholder.com");
  Object.entries(params).forEach(([key, value]) => {
    if (value === void 0) return;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, String(value));
    }
  });
  return url.pathname + url.search;
}
function parseQueryParams(url) {
  const searchParams = new URLSearchParams(url.split("?")[1] || "");
  const params = {};
  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  });
  return params;
}
export {
  buildUrl,
  calculateDistance,
  capitalize,
  debounce,
  deepClone,
  formatDate,
  formatDistance,
  formatNumber,
  formatPrice,
  formatPriceRange,
  formatRelativeDate,
  generateId,
  isEmpty,
  parseQueryParams,
  slugify,
  throttle,
  truncate
};
//# sourceMappingURL=utils.mjs.map