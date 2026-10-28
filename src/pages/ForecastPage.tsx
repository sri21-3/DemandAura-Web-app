import React from 'react';
import {
  DemandForecastPage,
  DemandForecastPageProps,
} from './DemandForecastPage';

export const ForecastPage: React.FC<DemandForecastPageProps> = (props) => {
  return <DemandForecastPage {...props} initialViewMode="all" />;
};
