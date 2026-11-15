-- Independent source aggregation for a bound date interval ($1 start, $2 end).
-- Use with a trusted read-only client, then compare to protected API.
SELECT count(ticket) AS trips,coalesce(sum(price_net),0) AS amount,coalesce(sum(net_wght),0)/1000.0 AS tonnes,
 coalesce(sum(price_net) FILTER (WHERE type_cach='เงินสด'),0) AS cash,
 coalesce(sum(price_net) FILTER (WHERE type_cach='เครดิต'),0) AS credit,
 coalesce(sum(price_net) FILTER (WHERE type_cach IS NULL OR type_cach NOT IN ('เงินสด','เครดิต')),0) AS other,
 max(synced_at) AS last_sync
FROM public.ticketsale
WHERE date_out_date BETWEEN $1::date AND $2::date AND status='O' AND status_cancel IS NULL AND source_deleted IS NOT TRUE;
SELECT prod_code,prod_name,count(ticket) trips,sum(price_net) amount,sum(net_wght)/1000.0 tonnes
FROM public.ticketsale WHERE date_out_date BETWEEN $1::date AND $2::date AND status='O' AND status_cancel IS NULL AND source_deleted IS NOT TRUE
GROUP BY prod_code,prod_name ORDER BY prod_code,prod_name;
SELECT CASE WHEN statkeep='ขึ้นโม่' THEN 'direct' WHEN statkeep='เทสต็อก' THEN 'stock' WHEN statkeep IN ('ตักสต็อกโม่','ตักสตีอกโม่') THEN 'internal' ELSE 'unclassified' END AS operation,
count(ticket) trips,sum(net_wght)/1000.0 tonnes,max(synced_at) last_sync
FROM public.ticketbuy WHERE date_in_date BETWEEN $1::date AND $2::date AND prod_code='09' AND source_deleted IS NOT TRUE GROUP BY 1 ORDER BY 1;
