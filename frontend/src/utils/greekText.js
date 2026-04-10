const ACCENT_MAP = {'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω','Ά':'Α','Έ':'Ε','Ή':'Η','Ί':'Ι','Ό':'Ο','Ύ':'Υ','Ώ':'Ω','ΐ':'ι','ΰ':'υ'};
const ACCENT_RE = /[άέήίόύώΆΈΉΊΌΎΏΐΰ]/g;

export const stripGreekAccents = (text) => {
  if (typeof text !== 'string') return text;
  return text.replace(ACCENT_RE, c => ACCENT_MAP[c] || c);
};
