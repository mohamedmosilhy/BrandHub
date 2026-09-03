import { useState } from 'react';

import { fireEvent, renderWithProviders, screen } from '@test/render';

import { emptyFilterDraft, FilterSheetContent } from './FilterSheetContent';

const labels = {
  sortBy: 'الترتيب',
  relevance: 'الأكثر ملاءمة',
  topRated: 'الأعلى تقييماً',
  priceAsc: 'السعر: الأقل أولاً',
  priceDesc: 'السعر: الأعلى أولاً',
  inStock: 'المتوفر فقط',
  priceRange: 'نطاق السعر',
  minPrice: 'أدنى',
  maxPrice: 'أعلى',
  rating: 'التقييم',
  rating4: '4 نجوم وأكثر',
  rating3: '3 نجوم وأكثر',
  rating2: 'نجمتان وأكثر',
  clear: 'مسح الفلاتر',
  apply: 'تطبيق',
  results: 'نتيجة',
};

describe('FilterSheetContent', () => {
  it('produces the expected domain criteria after an interaction sequence', async () => {
    const onApply = jest.fn();
    function Harness() {
      const [value, setValue] = useState(emptyFilterDraft);
      return (
        <FilterSheetContent
          value={value}
          matchCount={7}
          labels={labels}
          onChange={setValue}
          onClear={() => setValue(emptyFilterDraft)}
          onApply={onApply}
        />
      );
    }
    await renderWithProviders(<Harness />);

    await fireEvent.press(screen.getByLabelText('السعر: الأقل أولاً'));
    await fireEvent(screen.getByLabelText('المتوفر فقط'), 'valueChange', true);
    await fireEvent.changeText(screen.getByLabelText('أدنى'), '10.500');
    await fireEvent.changeText(screen.getByLabelText('أعلى'), '30');
    await fireEvent.press(screen.getByLabelText('4 نجوم وأكثر'));
    await fireEvent.press(screen.getByLabelText('تطبيق · 7 نتيجة'));

    const criteria = onApply.mock.calls[0]?.[0];
    expect(criteria.sort).toBe('price-asc');
    expect(criteria.inStock).toBe(true);
    expect(criteria.minPrice.toDecimalString()).toBe('10.500');
    expect(criteria.maxPrice.toDecimalString()).toBe('30.000');
    expect(criteria.minRating).toBe(4);
  });
});
