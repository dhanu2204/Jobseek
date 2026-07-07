package com.ai.jobseek.controller;

import java.util.HashMap;
import java.util.Map;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ai.jobseek.model.Users;
import com.ai.jobseek.service.UserService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils; // 1. Added missing import

@RestController
@RequestMapping("/payment")
@CrossOrigin("*")
public class PaymentController {

    @Autowired
    private RazorpayClient razorpayClient;
    
    @Autowired
    private UserService userservice; // Injecting as userservice (lowercase s)
    
    @Value("${razorpay.key.secret}")
    private String keySecret;

    // 2. Added missing @PostMapping annotation
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> data)
    {
        try {
            int amountInPaise = Integer.parseInt(data.get("amount").toString());
            Map<String, Object> options = new HashMap<>();
            options.put("amount", amountInPaise);
            options.put("currency", "INR");
            options.put("receipt", "receipt_id_" + System.currentTimeMillis());
            
            Order order = razorpayClient.orders.create(new JSONObject(options));
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", order.get("id"));
            response.put("amount", order.get("amount"));
            response.put("currency", order.get("currency"));

            return ResponseEntity.ok(response);
        }
        catch (Exception e) {
            e.printStackTrace();
            // 3. Fixed parenthesis placement
            return ResponseEntity.internalServerError().body("Error creating order: " + e.getMessage());
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> data)
    {
        try {
            String razorpayOrderId = data.get("razorpay_order_id");
            String razorpayPaymentId = data.get("razorpay_payment_id");
            String razorpaySignature = data.get("razorpay_signature");
            Integer userId = Integer.parseInt(data.get("userId"));
            
            JSONObject attribute = new JSONObject();
            attribute.put("razorpay_order_id", razorpayOrderId);
            attribute.put("razorpay_payment_id", razorpayPaymentId);
            attribute.put("razorpay_signature", razorpaySignature);

            boolean isValid = Utils.verifyPaymentSignature(attribute, keySecret);

            if (isValid) {
                // 4. Fixed variable name to match userservice
                Users upgradedUser = userservice.upgradeToPremium(userId);
                return ResponseEntity.ok(upgradedUser);
            }
            else {
                // 5. Fixed Map.of syntax and added semicolon
                return ResponseEntity.badRequest().body(Map.of("message", "payment verification failed"));
            }
        }
        catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error verifying payment: " + e.getMessage());
        }
    } 
}
