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
import {
  BuscadorComponent,
  CampoComponent,
  FiltrosComponent,
  FotoComponent,
  TarjetaEscaneoComponent,
} from './formulario';
import { BarraInferiorComponent, EncabezadoComponent } from './estructura';
import { FilaPendienteComponent, TarjetaPerfilComponent } from './datos';
import { DocumentoPipe } from './documento.pipe';

export * from './basicos';
export * from './formulario';
export * from './estructura';
export * from './datos';
export * from './documento.pipe';

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
  BuscadorComponent,
  FiltrosComponent,
  TarjetaEscaneoComponent,
  EncabezadoComponent,
  BarraInferiorComponent,
  TarjetaPerfilComponent,
  FilaPendienteComponent,
  DocumentoPipe,
] as const;
