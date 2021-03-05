import * as moment from 'moment';

export const formatDate = (value: moment.MomentInput, timeframe?: string) => {
  const unit = timeframe?.slice(-1);

  let format = 'DD/MM/YYYY HH:mm';
  switch (unit) {
    case 'd':
      format = 'DD/MM/YYYY';
      break;
    case 'M':
      format = 'MM/YYYY';
      break;
  }
  return moment(value).format(format);
};
