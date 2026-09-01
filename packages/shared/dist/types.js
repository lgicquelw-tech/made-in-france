"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/types/index.ts
var types_exports = {};
__export(types_exports, {
  BrandStatus: () => BrandStatus,
  EventType: () => EventType,
  MadeInFranceLevel: () => MadeInFranceLevel,
  ProductStatus: () => ProductStatus,
  SubscriptionTier: () => SubscriptionTier,
  UserRole: () => UserRole
});
module.exports = __toCommonJS(types_exports);
var MadeInFranceLevel = /* @__PURE__ */ ((MadeInFranceLevel2) => {
  MadeInFranceLevel2["FABRICATION_100_FRANCE"] = "FABRICATION_100_FRANCE";
  MadeInFranceLevel2["ASSEMBLE_FRANCE"] = "ASSEMBLE_FRANCE";
  MadeInFranceLevel2["CONCU_FRANCE"] = "CONCU_FRANCE";
  MadeInFranceLevel2["MATIERE_FRANCE"] = "MATIERE_FRANCE";
  MadeInFranceLevel2["ENTREPRISE_FRANCAISE"] = "ENTREPRISE_FRANCAISE";
  MadeInFranceLevel2["MIXTE"] = "MIXTE";
  return MadeInFranceLevel2;
})(MadeInFranceLevel || {});
var BrandStatus = /* @__PURE__ */ ((BrandStatus2) => {
  BrandStatus2["DRAFT"] = "DRAFT";
  BrandStatus2["PENDING_REVIEW"] = "PENDING_REVIEW";
  BrandStatus2["ACTIVE"] = "ACTIVE";
  BrandStatus2["SUSPENDED"] = "SUSPENDED";
  BrandStatus2["REJECTED"] = "REJECTED";
  return BrandStatus2;
})(BrandStatus || {});
var ProductStatus = /* @__PURE__ */ ((ProductStatus2) => {
  ProductStatus2["DRAFT"] = "DRAFT";
  ProductStatus2["ACTIVE"] = "ACTIVE";
  ProductStatus2["OUT_OF_STOCK"] = "OUT_OF_STOCK";
  ProductStatus2["DISCONTINUED"] = "DISCONTINUED";
  return ProductStatus2;
})(ProductStatus || {});
var SubscriptionTier = /* @__PURE__ */ ((SubscriptionTier2) => {
  SubscriptionTier2["FREE"] = "FREE";
  SubscriptionTier2["STARTER"] = "STARTER";
  SubscriptionTier2["STANDARD"] = "STANDARD";
  SubscriptionTier2["PREMIUM"] = "PREMIUM";
  return SubscriptionTier2;
})(SubscriptionTier || {});
var UserRole = /* @__PURE__ */ ((UserRole2) => {
  UserRole2["CONSUMER"] = "CONSUMER";
  UserRole2["BRAND_OWNER"] = "BRAND_OWNER";
  UserRole2["BRAND_MANAGER"] = "BRAND_MANAGER";
  UserRole2["ADMIN"] = "ADMIN";
  UserRole2["SUPER_ADMIN"] = "SUPER_ADMIN";
  return UserRole2;
})(UserRole || {});
var EventType = /* @__PURE__ */ ((EventType2) => {
  EventType2["BRAND_PAGE_VIEW"] = "BRAND_PAGE_VIEW";
  EventType2["PRODUCT_PAGE_VIEW"] = "PRODUCT_PAGE_VIEW";
  EventType2["SEARCH_RESULTS_VIEW"] = "SEARCH_RESULTS_VIEW";
  EventType2["SEARCH_QUERY"] = "SEARCH_QUERY";
  EventType2["FILTER_APPLIED"] = "FILTER_APPLIED";
  EventType2["MAP_INTERACTION"] = "MAP_INTERACTION";
  EventType2["CLICK_OUT"] = "CLICK_OUT";
  EventType2["AFFILIATE_CLICK"] = "AFFILIATE_CLICK";
  EventType2["ADD_TO_FAVORITES"] = "ADD_TO_FAVORITES";
  EventType2["AI_CONVERSATION"] = "AI_CONVERSATION";
  EventType2["AI_RECOMMENDATION_SHOWN"] = "AI_RECOMMENDATION_SHOWN";
  EventType2["AI_RECOMMENDATION_CLICKED"] = "AI_RECOMMENDATION_CLICKED";
  return EventType2;
})(EventType || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BrandStatus,
  EventType,
  MadeInFranceLevel,
  ProductStatus,
  SubscriptionTier,
  UserRole
});
//# sourceMappingURL=types.js.map