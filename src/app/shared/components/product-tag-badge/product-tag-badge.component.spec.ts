import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Product, Tag } from '../../../core/models/product.model';
import { ProductTagBadgeComponent } from './product-tag-badge.component';

describe('ProductTagBadgeComponent', () => {
  let component: ProductTagBadgeComponent;
  let fixture: ComponentFixture<ProductTagBadgeComponent>;

  const mockProduct: Product = {
    id: 1,
    name: 'Cupcake Teste',
    slug: 'cupcake-teste',
    description: 'Delicioso cupcake',
    price: 10.0,
    stock_quantity: 5,
    is_active: true,
    image_url: 'test.png',
    tags: [],
    created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductTagBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductTagBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create the component successfully', () => {
    fixture.componentRef.setInput('product', mockProduct);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Empty or Falsy Tags', () => {
    it('should return an empty array if tags is undefined or null', () => {
      const productWithoutTags = { ...mockProduct, tags: undefined as any };
      fixture.componentRef.setInput('product', productWithoutTags);
      fixture.detectChanges();

      expect(component.processedTags()).toEqual([]);
    });

    it('should return an empty array if tags array is empty', () => {
      fixture.componentRef.setInput('product', { ...mockProduct, tags: [] });
      fixture.detectChanges();

      expect(component.processedTags()).toEqual([]);
    });
  });

  describe('String-based Tags Processing', () => {
    it('should correctly process comma-separated string tags and map to correct metadata', () => {
      const productWithStringTags = {
        ...mockProduct,
        tags: 'sem-lactose, sem-gluten, vegano' as any,
      };
      fixture.componentRef.setInput('product', productWithStringTags);
      fixture.detectChanges();

      const tags = component.processedTags();
      expect(tags).toHaveLength(3);
      expect(tags[0]).toEqual({
        label: 'Sem Lactose',
        badgeClass: 'badge-lactose',
      });
      expect(tags[1]).toEqual({
        label: 'Sem Glúten',
        badgeClass: 'badge-gluten',
      });
      expect(tags[2]).toEqual({
        label: 'Vegano',
        badgeClass: 'badge-vegan',
      });
    });
  });

  describe('Object-based Tags Processing (Tag[])', () => {
    it('should correctly process an array of Tag objects using slug or name mapping', () => {
      const tagObjects: Tag[] = [
        { id: 1, name: 'Sem Lactose', slug: 'sem-lactose' },
        { id: 2, name: 'Gluten Free', slug: 'gluten-free' },
      ];

      fixture.componentRef.setInput('product', {
        ...mockProduct,
        tags: tagObjects,
      });
      fixture.detectChanges();

      const tags = component.processedTags();
      expect(tags).toHaveLength(2);
      expect(tags[0].label).toBe('Sem Lactose');
      expect(tags[0].badgeClass).toBe('badge-lactose');
      expect(tags[1].label).toBe('Sem Glúten');
      expect(tags[1].badgeClass).toBe('badge-gluten');
    });
  });

  describe('Custom Tags Fallback', () => {
    it('should format unmapped custom tags using title case and default badge class', () => {
      fixture.componentRef.setInput('product', {
        ...mockProduct,
        tags: 'artesanal-especial' as any,
      });
      fixture.detectChanges();

      const tags = component.processedTags();
      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({
        label: 'Artesanal Especial',
        badgeClass: 'badge-default',
      });
    });
  });
});
