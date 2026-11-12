import googleAzul from '../assets/placas/google-azul.webp';
import googlePreta from '../assets/placas/google-preta.webp';
import instagram from '../assets/placas/instagram.webp';
import cardapio from '../assets/placas/cardapio.webp';
import pix from '../assets/placas/pix.webp';
import wifi from '../assets/placas/wifi.webp';

export const IMG: Record<string, string> = {
  'google-azul': googleAzul, 'google-preta': googlePreta, instagram, cardapio, pix, wifi,
};
export const imgPlaca = (codigo: string) => IMG[codigo] ?? googleAzul;
