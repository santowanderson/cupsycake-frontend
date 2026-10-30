import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Product, Tag } from '../../../core/models/product.model';

interface TagConfig {
  label: string;
  badgeClass: string;
}

@Component({
  selector: 'app-product-tag-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'product-tag-badge.component.html',
  styleUrl: 'product-tag-badge.component.css',
})
export class ProductTagBadgeComponent {
  readonly product = input<Product>({} as Product);

  private static readonly TAG_METADATA_MAP: Record<string, TagConfig> = {
    'sem-lactose': { label: 'Sem Lactose', badgeClass: 'badge-lactose' },
    'lactose-free': { label: 'Sem Lactose', badgeClass: 'badge-lactose' },
    'sem-glutem': { label: 'Sem Glúten', badgeClass: 'badge-gluten' },
    'sem-gluten': { label: 'Sem Glúten', badgeClass: 'badge-gluten' },
    'sem-glúten': { label: 'Sem Glúten', badgeClass: 'badge-gluten' },
    'gluten-free': { label: 'Sem Glúten', badgeClass: 'badge-gluten' },
    vegano: { label: 'Vegano', badgeClass: 'badge-vegan' },
    vegan: { label: 'Vegano', badgeClass: 'badge-vegan' },
    vegetariano: { label: 'Vegetariano', badgeClass: 'badge-default' },
    vegetarian: { label: 'Vegetariano', badgeClass: 'badge-default' },
  };

  readonly processedTags = computed(() => {
    // Acessa o sinal executando product()
    const prod = this.product();
    if (!prod || !prod.tags) return [];

    const rawTags = prod.tags as any;
    let tagIdentifiers: (string | Tag)[] = [];

    if (typeof rawTags === 'string') {
      tagIdentifiers = rawTags
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);
    } else if (Array.isArray(rawTags)) {
      tagIdentifiers = rawTags;
    }

    return tagIdentifiers.map((tagItem) => {
      const identifier = this.getTagIdentifier(tagItem);
      return this.getTagConfig(identifier, tagItem);
    });
  });

  private getTagIdentifier(tag: Tag | string): string {
    if (!tag) return '';
    if (typeof tag === 'string') {
      return tag.trim().toLowerCase();
    }
    if (typeof tag === 'object' && tag !== null) {
      const raw = tag.slug || tag.name || '';
      return raw.trim().toLowerCase();
    }
    return String(tag).trim().toLowerCase();
  }

  private getTagConfig(
    identifier: string,
    originalTag: Tag | string,
  ): TagConfig {
    if (ProductTagBadgeComponent.TAG_METADATA_MAP[identifier]) {
      return ProductTagBadgeComponent.TAG_METADATA_MAP[identifier];
    }

    const fallbackText =
      typeof originalTag === 'object' && originalTag !== null
        ? originalTag.name || originalTag.slug || ''
        : String(originalTag || '');

    const formattedLabel = fallbackText
      ? fallbackText
          .split('-')
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(' ')
      : '';

    return {
      label: formattedLabel,
      badgeClass: 'badge-default',
    };
  }
}
