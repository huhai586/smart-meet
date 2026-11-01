import React from 'react';
import { CloseOutlined, StarFilled } from '@ant-design/icons';
import { useI18n } from '../../utils/i18n';
import './rating-prompt-card.scss';

const STAR_COUNT = 5;

interface RatingPromptCardProps {
  onRate: () => void;
  onDismiss: () => void;
}

/** Asks, once, for a Chrome Web Store review. Closing it in any way ends the ask for good. */
const RatingPromptCard: React.FC<RatingPromptCardProps> = ({ onRate, onDismiss }) => {
  const { t } = useI18n();

  return (
    <section className="rating-card" aria-label={t('rating_card_title')}>
      <button type="button" className="rating-card__close" onClick={onDismiss} aria-label={t('rating_card_close')}>
        <CloseOutlined />
      </button>
      <div className="rating-card__stars" aria-hidden="true">
        {Array.from({ length: STAR_COUNT }, (_, index) => (
          <StarFilled key={index} className="rating-card__star" style={{ animationDelay: `${index * 60}ms` }} />
        ))}
      </div>
      <h3 className="rating-card__title">{t('rating_card_title')}</h3>
      <p className="rating-card__desc">{t('rating_card_desc')}</p>
      <div className="rating-card__actions">
        <button type="button" className="rating-card__btn rating-card__btn--primary" onClick={onRate}>
          {t('rating_card_cta')}
        </button>
        <button type="button" className="rating-card__btn" onClick={onDismiss}>
          {t('rating_card_dismiss')}
        </button>
      </div>
    </section>
  );
};

export default RatingPromptCard;
