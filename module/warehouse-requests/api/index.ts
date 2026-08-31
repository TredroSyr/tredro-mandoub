import api from "@/lib/axios";
import {
  CreateStockTransferPayload,
  RepProductsListParams,
  RepProductsResponse,
  StockTransferDetailResponse,
  StockTransfersListParams,
  StockTransfersResponse,
} from "../types";

export const getRepProducts = async (
  params?: RepProductsListParams,
): Promise<RepProductsResponse> => {
  const response = await api.get("/reps/products/", { params });
  return response.data;
};

export const getStockTransfers = async (
  params?: StockTransfersListParams,
): Promise<StockTransfersResponse> => {
  const response = await api.get("/reps/stock-transfers/", { params });
  return response.data;
};

export const createStockTransfer = async (
  payload: CreateStockTransferPayload,
): Promise<StockTransferDetailResponse> => {
  const response = await api.post("/reps/stock-transfers/", payload, {
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  return response.data;
};

export const confirmStockTransfer = async (
  transferId: number,
): Promise<StockTransferDetailResponse> => {
  const response = await api.post(`/reps/stock-transfers/${transferId}/confirm/`);
  return response.data;
};

export const rejectStockTransfer = async (
  transferId: number,
): Promise<StockTransferDetailResponse> => {
  const response = await api.post(`/reps/stock-transfers/${transferId}/reject/`);
  return response.data;
};

export const receiveStockTransfer = async (
  transferId: number,
): Promise<StockTransferDetailResponse> => {
  const response = await api.post(
    `/reps/stock-transfers/${transferId}/receive/`,
    {},
    { headers: { "Idempotency-Key": crypto.randomUUID() } },
  );
  return response.data;
};
