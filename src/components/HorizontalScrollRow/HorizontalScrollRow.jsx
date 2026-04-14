import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import './HorizontalScrollRow.css';

/**
 * 通用橫向捲動列元件
 * 使用 Embla Carousel 實現，支援觸控滑動與鍵盤導航
 *
 * Props:
 *   - children: 卡片元素（每個直接子元素為一張卡片）
 *   - className: 外層附加 class
 */
const HorizontalScrollRow = ({ children, className = '' }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className={`hsr-root ${className}`}>
      {/* 左箭頭 */}
      <button
        className="hsr-arrow hsr-arrow-prev"
        onClick={scrollPrev}
        aria-label="往前"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 捲動容器 */}
      <div className="hsr-viewport" ref={emblaRef}>
        <div className="hsr-container">
          {React.Children.map(children, (child, index) => (
            <div className="hsr-slide" key={index}>
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* 右箭頭 */}
      <button
        className="hsr-arrow hsr-arrow-next"
        onClick={scrollNext}
        aria-label="往後"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

export default HorizontalScrollRow;
