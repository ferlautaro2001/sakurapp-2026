import {
  BannerComponent,
  BotonComponent,
  ChipComponent,
  IconoBotonComponent,
  IconoComponent,
  LogoComponent,
  ModalComponent,
  PushComponent,
  SeparadorComponent,
  SpinnerComponent,
  TextoBotonComponent,
  TituloComponent,
  VacioComponent,
} from './basicos';
import {
  AreaComponent,
  BuscadorComponent,
  CampoComponent,
  FiltrosComponent,
  FotoComponent,
  InterruptorComponent,
  SegmentadoComponent,
  TarjetaEscaneoComponent,
} from './formulario';
import { BarraInferiorComponent, EncabezadoComponent, PestanasComponent } from './estructura';
import {
  CarruselComponent,
  FilaEsperaComponent,
  FilaPendienteComponent,
  FilaProductoComponent,
  PlacaQrComponent,
  TarjetaMesaComponent,
  TarjetaPerfilComponent,
} from './datos';
import {
  BurbujaComponent,
  CantidadComponent,
  FilaPedidoComponent,
  RenglonPedidoComponent,
  ResumenPedidoComponent,
} from './pedidos';
import {
  DiapositivasComponent,
  GraficoBarrasComponent,
  GraficoLineaComponent,
  GraficoTortaComponent,
} from './graficos';
import { DocumentoPipe, FechaHoraPipe, HoraPipe, PesosPipe } from './pesos.pipe';

export * from './basicos';
export * from './formulario';
export * from './estructura';
export * from './datos';
export * from './pedidos';
export * from './graficos';
export * from './pesos.pipe';

/**
 * Todos los componentes del sistema de diseño, listos para importar de una vez
 * en cualquier pantalla: `imports: [...UI]`.
 */
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
  PushComponent,
  ModalComponent,
  CampoComponent,
  AreaComponent,
  BuscadorComponent,
  FiltrosComponent,
  SegmentadoComponent,
  InterruptorComponent,
  FotoComponent,
  TarjetaEscaneoComponent,
  EncabezadoComponent,
  BarraInferiorComponent,
  PestanasComponent,
  TarjetaPerfilComponent,
  TarjetaMesaComponent,
  FilaPendienteComponent,
  FilaProductoComponent,
  FilaEsperaComponent,
  CarruselComponent,
  PlacaQrComponent,
  GraficoTortaComponent,
  GraficoBarrasComponent,
  GraficoLineaComponent,
  DiapositivasComponent,
  ResumenPedidoComponent,
  RenglonPedidoComponent,
  FilaPedidoComponent,
  BurbujaComponent,
  CantidadComponent,
  PesosPipe,
  HoraPipe,
  FechaHoraPipe,
  DocumentoPipe,
] as const;
