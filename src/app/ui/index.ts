import {
  BannerComponent,
  BotonComponent,
  ChipComponent,
  IconoBotonComponent,
  IconoComponent,
  LogoComponent,
  ModalComponent,
  SeparadorComponent,
  SpinnerComponent,
  TextoBotonComponent,
  TituloComponent,
  VacioComponent,
} from './basicos';
import { CampoComponent, FotoComponent, TarjetaEscaneoComponent } from './formulario';
import { EncabezadoComponent } from './estructura';
import { TarjetaPerfilComponent } from './datos';

export * from './basicos';
export * from './formulario';
export * from './estructura';
export * from './datos';

/** Componentes del sistema de diseño para v0. */
export const UI = [
  IconoComponent,
  BotonComponent,
  TextoBotonComponent,
  IconoBotonComponent,
  ChipComponent,
  SeparadorComponent,
  LogoComponent,
  SpinnerComponent,
  TituloComponent,
  BannerComponent,
  VacioComponent,
  ModalComponent,
  CampoComponent,
  FotoComponent,
  TarjetaEscaneoComponent,
  EncabezadoComponent,
  TarjetaPerfilComponent,
] as const;

