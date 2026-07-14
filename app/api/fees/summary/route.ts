import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { FeeTransactionRepository } from "@/repositories/fee.repository";

export async function GET(req: Request) {
    const token = req.headers.get("cookie")?.match(/token=([^;]+)/)?.[1];
    const user = verifyToken(token);

    // Only admin and finance should see total revenue
    if (!user || !["admin", "finance"].includes(user.role)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    try {
        const feeTxRepo = new FeeTransactionRepository();
        
        // Supabase equivalent for sum
        const { data, error } = await feeTxRepo.getClient()
          .from('fee_transactions')
          .select('amount_paid')
          .eq('status', 'paid');
          
        if (error) throw error;
        
        const totalCollected = data.reduce((acc, row) => acc + Number(row.amount_paid), 0);

        return NextResponse.json({ success: true, totalCollected });
    } catch (error) {
        console.error("Error fetching fee summary:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch summary" }, { status: 500 });
    }
}
