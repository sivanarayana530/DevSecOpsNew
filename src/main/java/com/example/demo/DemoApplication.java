package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

@SpringBootApplication
@RestController
public class DemoApplication {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    // Setup a dummy table with data on startup
    @PostConstruct
    public void init() {
        jdbcTemplate.execute("CREATE TABLE users(id INT, username VARCHAR(255), password VARCHAR(255))");
        jdbcTemplate.execute("INSERT INTO users VALUES (1, 'admin', 'super-secret-pass')");
        jdbcTemplate.execute("INSERT INTO users VALUES (2, 'john_doe', 'p@ssword123')");
    }

    @GetMapping("/")
    public String home() {
        return "App is running. Try /user?id=1";
    }

    /**
     * VULNERABLE ENDPOINT
     * This is susceptible to SQL Injection because the 'id' parameter 
     * is directly appended to the query string.
     */
    @GetMapping("/user")
    public List<Map<String, Object>> getUser(@RequestParam String id) {
        // NEVER DO THIS IN PRODUCTION:
        String sql = "SELECT * FROM users WHERE id = " + id;
        
        return jdbcTemplate.queryForList(sql);
    }
}
