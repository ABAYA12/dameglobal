import { type NextRequest } from 'next/server';
import { stripeService } from '~/lib/stripe';
import { db } from '~/server/db';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature provided', { status: 400 });
    }

    const event = await stripeService.constructEvent(rawBody, signature);

    // Process the webhook event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSuccess(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
    }

    return new Response(JSON.stringify(event), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Webhook error', { status: 400 });
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    // Update payment record in database
    const payment = await db.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: paymentIntent.id,
        },
      });

      // Update invoice if this payment was for an invoice
      if (payment.invoiceId) {
        await db.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: 'PAID',
            paidAmount: payment.amount,
          },
        });
      }

      // Add timeline event
      if (payment.caseId) {
        await db.caseTimeline.create({
          data: {
            caseId: payment.caseId,
            event: 'Payment Received',
            description: `Payment of ${payment.currency} ${payment.amount} received successfully`,
            eventType: 'PAYMENT_RECEIVED',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handleInvoicePaymentSuccess(invoice: any) {
  try {
    // Update invoice record in database
    const dbInvoice = await db.invoice.findFirst({
      where: { invoiceNumber: invoice.number },
    });

    if (dbInvoice) {
      await db.invoice.update({
        where: { id: dbInvoice.id },
        data: {
          status: 'PAID',
          paidAmount: invoice.amount_paid / 100, // Convert from cents
        },
      });
    }
  } catch (error) {
    console.error('Error handling invoice payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    // Update payment record in database
    const payment = await db.payment.findFirst({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
        },
      });

      // Add timeline event
      if (payment.caseId) {
        await db.caseTimeline.create({
          data: {
            caseId: payment.caseId,
            event: 'Payment Failed',
            description: `Payment of ${payment.currency} ${payment.amount} failed`,
            eventType: 'PAYMENT_RECEIVED', // We might want to add a PAYMENT_FAILED type
          },
        });
      }
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}
