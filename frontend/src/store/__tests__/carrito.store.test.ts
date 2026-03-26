import { describe, it, expect, beforeEach } from 'vitest';
import { useCarritoStore } from '../carrito.store';

describe('CarritoStore', () => {
  beforeEach(() => {
    useCarritoStore.setState({
      items: [],
      reservasConfirmadas: [],
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
  });

  it('estado inicial tiene items vacíos', () => {
    const { items } = useCarritoStore.getState();
    expect(items).toEqual([]);
  });

  it('estado inicial tiene anonymousId generado', () => {
    const { anonymousId } = useCarritoStore.getState();
    expect(anonymousId).toBeTruthy();
    expect(typeof anonymousId).toBe('string');
  });

  it('estado inicial tiene expiresAt calculado', () => {
    const { expiresAt } = useCarritoStore.getState();
    expect(expiresAt).toBeGreaterThan(Date.now());
  });

  it('agregarAlCarrito agrega un item con tempId y addedAt', () => {
    const item = {
      productId: 'prod-1',
      nombre: 'Samsung Galaxy S24',
      marca: 'Samsung',
      precio: 15999,
      tipoPago: 'CONTADO' as const,
    };

    useCarritoStore.getState().agregarAlCarrito(item);

    const { items } = useCarritoStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].tempId).toBeTruthy();
    expect(items[0].addedAt).toBeTruthy();
    expect(items[0].productId).toBe('prod-1');
    expect(items[0].nombre).toBe('Samsung Galaxy S24');
    expect(items[0].precio).toBe(15999);
    expect(items[0].tipoPago).toBe('CONTADO');
  });

  it('agregarAlCarrito renueva expiresAt', () => {
    const before = Date.now() + 30 * 24 * 60 * 60 * 1000;

    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Test',
      marca: 'Test',
      precio: 1000,
      tipoPago: 'CONTADO',
    });

    const { expiresAt } = useCarritoStore.getState();
    expect(expiresAt).toBeGreaterThanOrEqual(before);
  });

  it('eliminarDelCarrito elimina el item correcto', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Producto 1',
      marca: 'Marca',
      precio: 1000,
      tipoPago: 'CONTADO',
    });
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-2',
      nombre: 'Producto 2',
      marca: 'Marca',
      precio: 2000,
      tipoPago: 'CREDITO',
    });

    const { items } = useCarritoStore.getState();
    const tempIdToDelete = items[0].tempId;

    useCarritoStore.getState().eliminarDelCarrito(tempIdToDelete);

    const { items: remaining } = useCarritoStore.getState();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].productId).toBe('prod-2');
  });

  it('eliminarDelCarrito renueva expiresAt', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Test',
      marca: 'Test',
      precio: 1000,
      tipoPago: 'CONTADO',
    });

    const { items } = useCarritoStore.getState();
    const before = Date.now() + 30 * 24 * 60 * 60 * 1000;

    useCarritoStore.getState().eliminarDelCarrito(items[0].tempId);

    const { expiresAt } = useCarritoStore.getState();
    expect(expiresAt).toBeGreaterThanOrEqual(before);
  });

  it('cambiarTipoPago actualiza el tipo de pago del item', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Test',
      marca: 'Test',
      precio: 1000,
      tipoPago: 'CONTADO',
    });

    const { items } = useCarritoStore.getState();
    const tempId = items[0].tempId;

    useCarritoStore.getState().cambiarTipoPago(tempId, 'CREDITO');

    const { items: updated } = useCarritoStore.getState();
    expect(updated[0].tipoPago).toBe('CREDITO');
  });

  it('cambiarTipoPago renueva expiresAt', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Test',
      marca: 'Test',
      precio: 1000,
      tipoPago: 'CONTADO',
    });

    const { items } = useCarritoStore.getState();
    const tempId = items[0].tempId;
    const before = Date.now() + 30 * 24 * 60 * 60 * 1000;

    useCarritoStore.getState().cambiarTipoPago(tempId, 'CREDITO');

    const { expiresAt } = useCarritoStore.getState();
    expect(expiresAt).toBeGreaterThanOrEqual(before);
  });

  it('vaciarCarrito limpia todos los items', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Producto 1',
      marca: 'Marca',
      precio: 1000,
      tipoPago: 'CONTADO',
    });
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-2',
      nombre: 'Producto 2',
      marca: 'Marca',
      precio: 2000,
      tipoPago: 'CREDITO',
    });

    useCarritoStore.getState().vaciarCarrito();

    const { items } = useCarritoStore.getState();
    expect(items).toEqual([]);
  });

  it('getCantidadTotal retorna el número correcto de items', () => {
    expect(useCarritoStore.getState().getCantidadTotal()).toBe(0);

    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Producto 1',
      marca: 'Marca',
      precio: 1000,
      tipoPago: 'CONTADO',
    });
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-2',
      nombre: 'Producto 2',
      marca: 'Marca',
      precio: 2000,
      tipoPago: 'CREDITO',
    });

    expect(useCarritoStore.getState().getCantidadTotal()).toBe(2);
  });

  it('getTotalPrecio retorna la suma correcta de precios', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Producto 1',
      marca: 'Marca',
      precio: 15999,
      tipoPago: 'CONTADO',
    });
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-2',
      nombre: 'Producto 2',
      marca: 'Marca',
      precio: 9999,
      tipoPago: 'CREDITO',
    });

    expect(useCarritoStore.getState().getTotalPrecio()).toBe(25998);
  });

  it('tieneProductosCredito retorna true si hay items a crédito', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Producto 1',
      marca: 'Marca',
      precio: 1000,
      tipoPago: 'CREDITO',
    });

    expect(useCarritoStore.getState().tieneProductosCredito()).toBe(true);
  });

  it('tieneProductosCredito retorna false si no hay items a crédito', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Producto 1',
      marca: 'Marca',
      precio: 1000,
      tipoPago: 'CONTADO',
    });

    expect(useCarritoStore.getState().tieneProductosCredito()).toBe(false);
  });

  it('contarProductosCredito cuenta correctamente los items a crédito', () => {
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-1',
      nombre: 'Producto 1',
      marca: 'Marca',
      precio: 1000,
      tipoPago: 'CONTADO',
    });
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-2',
      nombre: 'Producto 2',
      marca: 'Marca',
      precio: 2000,
      tipoPago: 'CREDITO',
    });
    useCarritoStore.getState().agregarAlCarrito({
      productId: 'prod-3',
      nombre: 'Producto 3',
      marca: 'Marca',
      precio: 3000,
      tipoPago: 'CREDITO',
    });

    expect(useCarritoStore.getState().contarProductosCredito()).toBe(2);
  });

  it('getAnonymousId retorna el anonymousId', () => {
    const { anonymousId } = useCarritoStore.getState();
    expect(useCarritoStore.getState().getAnonymousId()).toBe(anonymousId);
  });
});
