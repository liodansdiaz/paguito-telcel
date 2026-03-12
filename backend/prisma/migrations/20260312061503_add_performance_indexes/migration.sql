-- CreateIndex
CREATE INDEX "customers_estado_createdAt_idx" ON "customers"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_reservationId_status_idx" ON "notifications"("reservationId", "status");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_expiresAt_idx" ON "password_reset_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "products_isActive_marca_createdAt_idx" ON "products"("isActive", "marca", "createdAt");

-- CreateIndex
CREATE INDEX "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_expiresAt_idx" ON "refresh_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_revokedAt_idx" ON "refresh_tokens"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "reservations_vendorId_estado_createdAt_idx" ON "reservations"("vendorId", "estado", "createdAt");

-- CreateIndex
CREATE INDEX "reservations_curp_tipoPago_estado_idx" ON "reservations"("curp", "tipoPago", "estado");

-- CreateIndex
CREATE INDEX "reservations_curp_estado_idx" ON "reservations"("curp", "estado");

-- CreateIndex
CREATE INDEX "reservations_estado_createdAt_idx" ON "reservations"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "reservations_vendorId_fechaPreferida_idx" ON "reservations"("vendorId", "fechaPreferida");

-- CreateIndex
CREATE INDEX "users_isActive_rol_lastAssignedAt_createdAt_idx" ON "users"("isActive", "rol", "lastAssignedAt", "createdAt");

-- CreateIndex
CREATE INDEX "users_isActive_rol_idx" ON "users"("isActive", "rol");
