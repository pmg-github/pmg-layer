import { Node, mergeAttributes } from "@tiptap/core";
import { VueNodeViewRenderer, type NodeViewProps } from "@tiptap/vue-3";
import type { Component } from "vue";
import Customer from "../../components/tiptap/Customer.vue";

export interface SupplierInfoOptions {
  HTMLAttributes: Record<string, any>;
}

export interface CustomerAttributes {
  klnr?: string;
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customer: {
      insertCustomer: (attrs?: CustomerAttributes) => ReturnType;
    };
    supplierInfo: {
      /**
       * Insert a supplier info block
       */
      setSupplierInfo: (attrs?: CustomerAttributes) => ReturnType;
    };
  }
}

export default Node.create<SupplierInfoOptions>({
  name: "customer",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      klnr: {
        default: "",
      },
      name: {
        default: "",
      },
      address: {
        default: "",
      },
      city: {
        default: "",
      },
      phone: {
        default: "",
      },
      email: {
        default: "",
      },
      website: {
        default: "",
      },
      logo: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.supplierInfo",
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          const element = node as HTMLElement;

          // Check if it has data attributes (new format)
          const dataName = element.getAttribute("data-name");
          if (dataName) {
            return {
              klnr: element.getAttribute("data-klnr") || "",
              name: dataName,
              address: element.getAttribute("data-address") || "",
              city: element.getAttribute("data-city") || "",
              phone: element.getAttribute("data-phone") || "",
              email: element.getAttribute("data-email") || "",
              website: element.getAttribute("data-website") || "",
              logo: element.getAttribute("data-logo") || "",
            };
          }

          // Otherwise parse old format with .info and .logo divs
          const infoDiv = element.querySelector(".info");
          const logoDiv = element.querySelector(".logo");

          if (!infoDiv) return false;

          // Extract name (from <strong> tag)
          const nameElement = infoDiv.querySelector("strong");
          const name = nameElement?.textContent?.trim() || "";

          // Clone the info div to manipulate it
          const infoClone = infoDiv.cloneNode(true) as HTMLElement;

          // Remove the strong tag (name)
          const strongTag = infoClone.querySelector("strong");
          if (strongTag) {
            strongTag.remove();
          }

          // Extract email from mailto link
          let email = "";
          const emailLink = infoClone.querySelector('a[href^="mailto:"]');
          if (emailLink) {
            email = emailLink.textContent?.trim() || "";
            emailLink.remove();
          }

          // Extract website from http/https link
          let website = "";
          const websiteLinks = infoClone.querySelectorAll('a[href^="http"]');
          if (websiteLinks.length > 0) {
            website = websiteLinks[0]?.getAttribute("href") || "";
            websiteLinks[0]?.remove();
          }

          // Now split by <br> tags to get remaining text content
          const infoHTML = infoClone.innerHTML;
          const parts = infoHTML
            .split(/<br\s*\/?>/i)
            .map((part) => part.replace(/<[^>]*>/g, "").trim())
            .filter((part) => part.length > 0);

          // Extract individual fields from remaining parts
          let address = "";
          let city = "";
          let phone = "";

          parts.forEach((part) => {
            // Check if it's a phone number (starts with + or is all digits)
            if (part.match(/^\+?\d{8,}/)) {
              phone = part;
            }
            // Check if it's a city with postal code (contains digits at start)
            else if (part.match(/^\d{4}/)) {
              city = part;
            }
            // Otherwise, it's likely the address (if not already set)
            else if (!address && part.length > 0) {
              address = part;
            }
          });

          // Extract logo
          let logo = "";
          if (logoDiv) {
            const imgElement = logoDiv.querySelector("img");
            if (imgElement) {
              logo = imgElement.getAttribute("src") || "";
              // Ensure logo has full URL if it starts with /
              if (logo.startsWith("/")) {
                logo = `https://static.pmg.be${logo}`;
              }
            }
          }

          return {
            name,
            address,
            city,
            phone,
            email,
            website,
            logo,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "supplierInfo",
      }),
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(Customer as Component<NodeViewProps>);
  },

  addCommands() {
    return {
      insertCustomer:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent([
            { type: this.name, attrs },
            { type: 'paragraph' },
          ]),
      setSupplierInfo:
        (attrs = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
